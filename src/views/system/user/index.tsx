import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  TreeSelect,
  type TableProps,
} from "antd";
import {
  DownloadOutlined,
  LeftOutlined,
  ManOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  UploadOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import DeptAPI from "@/api/system/dept";
import RoleAPI from "@/api/system/role";
import UserAPI from "@/api/system/user";
import type { UserForm, UserItem, UserQueryParams } from "@/api/system/user";
import type { OptionItem } from "@/api/common";
import Auth from "@/components/Auth";
import DictSelect from "@/components/DictSelect";
import RefreshButton from "@/components/RefreshButton";
import { CommonStatus, UserGender } from "@/enums";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useUserStore } from "@/stores/user";
import { downloadFile } from "@/utils/download";
import UserDeptTree from "./components/UserDeptTree";
import UserImportDialog from "./components/UserImportDialog";
import { validateForm } from "@/utils/form";

import "./index.scss";

/** 时间范围查询用的日期格式 */
const DATE_FORMAT = "YYYY-MM-DD";

/** 树形选项节点 */
interface TreeOption {
  value: string;
  label: string;
  children?: TreeOption[];
}

/**
 * 部门选项转树选择数据
 */
function toDeptTreeData(options: OptionItem[]): TreeOption[] {
  return options.map((option) => ({
    value: String(option.value),
    label: option.label,
    children: option.children?.length ? toDeptTreeData(option.children) : undefined,
  }));
}

/** 用户管理 */
export default function UserList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [searchForm] = Form.useForm<UserQueryParams>();
  const [userForm] = Form.useForm<UserForm>();
  const [resetForm] = Form.useForm<{ password: string }>();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
  const [roleOptions, setRoleOptions] = useState<OptionItem[]>([]);

  const [resetDialog, setResetDialog] = useState<{
    open: boolean;
    userId?: string;
    label?: string;
  }>({
    open: false,
  });
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const currentUserId = useUserStore((state) => state.userInfo.userId);

  const fetcher = useCallback((params: UserQueryParams) => UserAPI.getPage(params), []);
  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    UserItem,
    UserQueryParams
  >({ fetcher });

  useEffect(() => {
    fetchDeptOptions();
  }, []);

  const deptTreeData = useMemo(() => toDeptTreeData(deptOptions), [deptOptions]);

  /** 加载部门选项 */
  async function fetchDeptOptions() {
    setDeptOptions((await DeptAPI.getOptions()) ?? []);
  }

  function handleSearch() {
    const { createTime, ...rest } = searchForm.getFieldsValue();
    setQueryParams((prev) => ({
      ...prev,
      ...rest,
      // 日期范围在表单里是 Dayjs，落库前转成字符串
      createTime: createTime
        ? [
            dayjs(createTime[0] as unknown as string).format(DATE_FORMAT),
            dayjs(createTime[1] as unknown as string).format(DATE_FORMAT),
          ]
        : undefined,
      pageNum: 1,
    }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({
      ...prev,
      keywords: undefined,
      status: undefined,
      createTime: undefined,
      deptId: undefined,
      pageNum: 1,
    }));
  }

  /** 点击部门树节点后按部门查询 */
  function handleDeptChange(deptId: string | number) {
    setQueryParams((prev) => ({ ...prev, deptId: String(deptId), pageNum: 1 }));
  }

  /** 加载表单所需的下拉选项 */
  async function loadFormOptions() {
    const [roles, depts] = await Promise.all([RoleAPI.getOptions(), DeptAPI.getOptions()]);
    setRoleOptions(roles ?? []);
    setDeptOptions(depts ?? []);
  }

  async function openCreateDialog() {
    setEditingId(undefined);
    userForm.resetFields();
    userForm.setFieldsValue({ status: CommonStatus.ENABLED });
    await loadFormOptions();
    setDialogOpen(true);
  }

  async function openUpdateDialog(id: string) {
    const data = await UserAPI.getFormData(id);
    await loadFormOptions();
    setEditingId(id);
    userForm.resetFields();
    userForm.setFieldsValue(data);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(userForm);
    if (!values) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await UserAPI.update(editingId, { ...values, id: editingId });
      } else {
        await UserAPI.create(values);
      }
      message.success(t("common.saveSuccess"));
      setDialogOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  /** 删除用户，删除前拦住「把自己删掉」这条路径 */
  function handleDelete(userIds: string) {
    if (!userIds) {
      message.warning(t("common.selectRequired"));
      return;
    }

    const deletingSelf = userIds
      .split(",")
      .some((id) => currentUserId != null && id === String(currentUserId));
    if (deletingSelf) {
      message.error(t("system.user.cannotDeleteSelf"));
      return;
    }

    modal.confirm({
      title: t("common.tips"),
      content: t("system.user.deleteConfirm"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await UserAPI.deleteByIds(userIds);
        message.success(t("common.deleteSuccess"));
        setSelectedIds([]);
        fetchList();
      },
    });
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) {
      message.warning(t("common.selectRequired"));
      return;
    }
    handleDelete(selectedIds.join(","));
  }

  /** 导出当前查询条件下的用户列表 */
  async function handleExport() {
    const response = await UserAPI.export(queryParams);
    downloadFile(response);
    message.success(t("system.user.exportSuccess"));
  }

  async function handleResetPasswordSubmit() {
    const values = await validateForm(resetForm);
    if (!values || !resetDialog.userId) return;

    setResetSubmitting(true);
    try {
      await UserAPI.resetPassword(resetDialog.userId, values.password);
      message.success(t("system.user.resetPasswordSuccess"));
      setResetDialog({ open: false });
      resetForm.resetFields();
    } finally {
      setResetSubmitting(false);
    }
  }

  /** 取昵称/用户名首字母作为头像占位 */
  function getAvatarText(record: UserItem) {
    return (record.nickname || record.username || "?").slice(0, 1).toUpperCase();
  }

  const columns: TableProps<UserItem>["columns"] = [
    {
      title: t("system.user.nickname"),
      dataIndex: "nickname",
      minWidth: 160,
      fixed: "left",
      render: (nickname: string, record) => (
        <div className="user-name-cell">
          {record.avatar ? (
            <Avatar size={24} src={record.avatar} />
          ) : (
            <span className="user-name-cell__text">{getAvatarText(record)}</span>
          )}
          <span>{nickname || "-"}</span>
        </div>
      ),
    },
    { title: t("system.user.username"), dataIndex: "username", minWidth: 120, ellipsis: true },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 90,
      align: "center",
      render: (status: number) =>
        status === CommonStatus.ENABLED ? (
          <Tag color="success">{t("system.user.statusNormal")}</Tag>
        ) : (
          <Tag color="error">{t("common.disabled")}</Tag>
        ),
    },
    {
      title: t("system.user.gender"),
      dataIndex: "gender",
      width: 90,
      align: "center",
      render: (gender: number) => {
        if (gender !== UserGender.MALE && gender !== UserGender.FEMALE) return "-";
        const isMale = gender === UserGender.MALE;
        return (
          <Tag color={isMale ? "processing" : "error"}>
            {isMale ? <ManOutlined /> : <WomanOutlined />}
            {isMale ? t("system.user.male") : t("system.user.female")}
          </Tag>
        );
      },
    },
    { title: t("system.user.dept"), dataIndex: "deptName", minWidth: 140, ellipsis: true },
    { title: t("system.user.roleNames"), dataIndex: "roleNames", minWidth: 160, ellipsis: true },
    { title: t("system.user.mobile"), dataIndex: "mobile", width: 130 },
    { title: t("system.user.email"), dataIndex: "email", minWidth: 180, ellipsis: true },
    { title: t("common.createTime"), dataIndex: "createTime", width: 180 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Auth perm="sys:user:update">
            <Button type="link" size="small" onClick={() => openUpdateDialog(record.id)}>
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:user:delete">
            <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
              {t("common.delete")}
            </Button>
          </Auth>
          <Auth perm="sys:user:reset-password">
            <Button
              type="link"
              size="small"
              onClick={() =>
                setResetDialog({
                  open: true,
                  userId: record.id,
                  label: record.nickname
                    ? `${record.nickname}（${record.username}）`
                    : record.username,
                })
              }
            >
              {t("system.user.resetPassword")}
            </Button>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container page-container--split user-page">
      <aside className={`page-aside${sidebarCollapsed ? " is-collapsed" : ""}`}>
        <div className="page-aside__inner">
          <UserDeptTree
            value={queryParams.deptId}
            onChange={handleDeptChange}
            onNodeClick={fetchList}
          />
        </div>

        <button
          className="page-aside__toggle"
          type="button"
          title={sidebarCollapsed ? t("system.user.expandAside") : t("system.user.collapseAside")}
          onClick={() => setSidebarCollapsed((prev) => !prev)}
        >
          {sidebarCollapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </aside>

      <div className="page-main">
        <Card className="page-search">
          <Form form={searchForm} layout="inline" onFinish={handleSearch}>
            <Form.Item name="keywords" label={t("common.keyword")}>
              <Input
                allowClear
                className="w-180px"
                placeholder={t("system.user.keyword")}
                onPressEnter={handleSearch}
              />
            </Form.Item>
            <Form.Item name="status" label={t("common.status")}>
              <Select
                allowClear
                className="w-112px"
                placeholder={t("system.user.all")}
                options={[
                  { value: CommonStatus.ENABLED, label: t("system.user.statusNormal") },
                  { value: CommonStatus.DISABLED, label: t("common.disabled") },
                ]}
              />
            </Form.Item>
            <Form.Item name="createTime" label={t("common.createTime")}>
              <DatePicker.RangePicker className="w-240px" format={DATE_FORMAT} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                  {t("common.search")}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  {t("common.reset")}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Card className="page-content">
          <div className="page-toolbar">
            <Space>
              <Auth perm="sys:user:create">
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
                  {t("common.create")}
                </Button>
              </Auth>
              <Auth perm="sys:user:delete">
                <Button danger disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
                  {t("common.delete")}
                </Button>
              </Auth>
            </Space>

            <Space>
              <Auth perm="sys:user:import">
                <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
                  {t("system.user.import")}
                </Button>
              </Auth>
              <Auth perm="sys:user:export">
                <Button icon={<DownloadOutlined />} onClick={handleExport}>
                  {t("system.user.export")}
                </Button>
              </Auth>
              <RefreshButton onClick={fetchList} loading={loading} />
            </Space>
          </div>

          <Table<UserItem>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={list}
            scroll={{ x: 1500 }}
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys.map(String)),
            }}
            pagination={{
              current: queryParams.pageNum,
              pageSize: queryParams.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (count) => t("common.total", { total: count }),
              onChange: (pageNum, pageSize) =>
                setQueryParams((prev) => ({ ...prev, pageNum, pageSize })),
            }}
          />
        </Card>
      </div>

      <Drawer
        title={editingId ? t("system.user.editTitle") : t("system.user.createTitle")}
        size={600}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        footer={
          <Space className="flex-x-end">
            <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t("common.confirm")}
            </Button>
          </Space>
        }
      >
        <Form form={userForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item
            name="username"
            label={t("system.user.username")}
            rules={[{ required: true, message: t("system.user.usernameRequired") }]}
          >
            <Input
              readOnly={Boolean(editingId)}
              placeholder={t("system.user.usernamePlaceholder")}
            />
          </Form.Item>
          <Form.Item
            name="nickname"
            label={t("system.user.nickname")}
            rules={[{ required: true, message: t("system.user.nicknameRequired") }]}
          >
            <Input placeholder={t("system.user.nicknamePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="deptId"
            label={t("system.user.dept")}
            rules={[{ required: true, message: t("system.user.deptRequired") }]}
          >
            <TreeSelect
              treeData={deptTreeData}
              showSearch
              treeDefaultExpandAll
              treeNodeFilterProp="label"
              placeholder={t("system.user.deptPlaceholder")}
            />
          </Form.Item>
          <Form.Item name="gender" label={t("system.user.gender")}>
            <DictSelect code="gender" />
          </Form.Item>
          <Form.Item
            name="roleIds"
            label={t("system.user.roleNames")}
            rules={[{ required: true, message: t("system.user.roleRequired") }]}
          >
            <Select
              mode="multiple"
              placeholder={t("common.pleaseSelect")}
              options={roleOptions.map((item) => ({ value: item.value, label: item.label }))}
            />
          </Form.Item>
          <Form.Item
            name="mobile"
            label={t("system.user.mobile")}
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: t("system.user.mobileInvalid") }]}
          >
            <Input maxLength={11} placeholder={t("system.user.mobilePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("system.user.email")}
            rules={[{ type: "email", message: t("system.user.emailInvalid") }]}
          >
            <Input maxLength={50} placeholder={t("system.user.emailPlaceholder")} />
          </Form.Item>
          <Form.Item
            name="status"
            label={t("common.status")}
            getValueProps={(value) => ({ checked: value !== CommonStatus.DISABLED })}
            normalize={(checked: boolean) =>
              checked ? CommonStatus.ENABLED : CommonStatus.DISABLED
            }
          >
            <Switch
              checkedChildren={t("system.user.statusNormal")}
              unCheckedChildren={t("common.disabled")}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={t("system.user.resetPassword")}
        width={420}
        open={resetDialog.open}
        confirmLoading={resetSubmitting}
        onOk={handleResetPasswordSubmit}
        onCancel={() => {
          setResetDialog({ open: false });
          resetForm.resetFields();
        }}
        destroyOnHidden
      >
        <div className="mb-4">
          {t("system.user.resetPasswordUser")}
          {resetDialog.label || "-"}
        </div>
        <Form form={resetForm} labelCol={{ span: 7 }} wrapperCol={{ span: 16 }}>
          <Form.Item
            name="password"
            label={t("system.user.newPassword")}
            rules={[
              { required: true, message: t("system.user.passwordRequired") },
              { min: 6, message: t("system.user.passwordMin") },
            ]}
          >
            <Input.Password
              autoComplete="new-password"
              placeholder={t("system.user.newPasswordPlaceholder")}
            />
          </Form.Item>
        </Form>
      </Modal>

      <UserImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={fetchList}
      />
    </div>
  );
}

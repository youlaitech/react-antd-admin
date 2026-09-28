import { useEffect, useState } from "react";
import {
  Alert,
  App as AntdApp,
  Button,
  Input,
  Modal,
  Progress,
  Radio,
  Space,
  Typography,
} from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";

import type { GeneratorPreviewItem } from "@/api/codegen";
import { useLocalWrite, type OverwriteMode, type WriteScope } from "../composables/useLocalWrite";

interface WriteLocalDialogProps {
  /** 是否展示 */
  open: boolean;
  /** 预览产出的全部文件 */
  files: GeneratorPreviewItem[];
  /** 前端项目名，用于剥掉路径前缀 */
  frontendAppName?: string;
  /** 后端项目名，用于剥掉路径前缀 */
  backendAppName?: string;
  /** 关闭 */
  onClose: () => void;
}

/**
 * 写入本地工程
 * 免去「下载 ZIP → 解压 → 拷贝」的往返；不支持的浏览器提示改用下载
 */
export default function WriteLocalDialog({
  open,
  files,
  frontendAppName,
  backendAppName,
  onClose,
}: WriteLocalDialogProps) {
  const { message } = AntdApp.useApp();
  const local = useLocalWrite();
  // 单独取出 reset：hook 每次返回的是新对象，直接用它做依赖会让效果每次都跑
  const { reset } = local;

  const [scope, setScope] = useState<WriteScope>("all");
  const [overwriteMode, setOverwriteMode] = useState<OverwriteMode>("ifChanged");

  // 每次打开都重新选择目录：句柄不跨会话保留，留着反而会让人以为还能写
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  /** 目录是否已按写入范围备齐 */
  const dirReady =
    scope === "all"
      ? Boolean(local.frontendName && local.backendName)
      : scope === "frontend"
        ? Boolean(local.frontendName)
        : Boolean(local.backendName);

  /** 执行写入 */
  async function handleWrite() {
    const result = await local.writeFiles(files, {
      scope,
      overwriteMode,
      frontendAppName,
      backendAppName,
    });

    if (!result.ok) {
      message.warning("请先选择所需的前/后端目录");
      return;
    }
    if (result.failed.length) {
      message.warning(
        `写入完成 ${result.total - result.failed.length} 个文件，失败 ${result.failed.length} 个`
      );
      return;
    }

    message.success(`写入完成，共 ${result.total} 个文件`);
    onClose();
  }

  return (
    <Modal
      title="写入本地工程"
      width={620}
      open={open}
      destroyOnHidden
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={local.running}
            disabled={!local.supports || !dirReady || !files.length}
            onClick={handleWrite}
          >
            开始写入
          </Button>
        </Space>
      }
    >
      {!local.supports && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="当前浏览器不支持本地写入"
          description="本地写入依赖 File System Access API，仅 Chrome / Edge 等内核支持，可改用下载 ZIP。"
        />
      )}

      <div className="write-local__row">
        <Typography.Text className="write-local__label">前端目录</Typography.Text>
        <Input value={local.frontendName} placeholder="选择前端工程根目录" readOnly />
        <Button
          icon={<FolderOpenOutlined />}
          disabled={!local.supports}
          onClick={() => local.pickDirectory("frontend")}
        >
          选择
        </Button>
      </div>

      <div className="write-local__row">
        <Typography.Text className="write-local__label">后端目录</Typography.Text>
        <Input value={local.backendName} placeholder="选择后端工程根目录" readOnly />
        <Button
          icon={<FolderOpenOutlined />}
          disabled={!local.supports}
          onClick={() => local.pickDirectory("backend")}
        >
          选择
        </Button>
      </div>

      <div className="write-local__row">
        <Typography.Text className="write-local__label">写入范围</Typography.Text>
        <Radio.Group
          value={scope}
          onChange={(event) => setScope(event.target.value as WriteScope)}
          options={[
            { label: "全部", value: "all" },
            { label: "仅前端", value: "frontend" },
            { label: "仅后端", value: "backend" },
          ]}
        />
      </div>

      <div className="write-local__row">
        <Typography.Text className="write-local__label">同名文件</Typography.Text>
        <Radio.Group
          value={overwriteMode}
          onChange={(event) => setOverwriteMode(event.target.value as OverwriteMode)}
          options={[
            { label: "覆盖", value: "overwrite" },
            { label: "跳过", value: "skip" },
            { label: "内容有变才写", value: "ifChanged" },
          ]}
        />
      </div>

      {local.running && (
        <div className="write-local__progress">
          <Progress
            percent={
              local.progress.total
                ? Math.round((local.progress.done / local.progress.total) * 100)
                : 0
            }
            status="active"
          />
          <Typography.Text type="secondary" ellipsis>
            正在写入 {local.progress.current}
          </Typography.Text>
        </div>
      )}

      <Typography.Text type="secondary" className="write-local__tip">
        共 {files.length} 个待写入文件，目录只读取名字，内容写入浏览器授权范围内
      </Typography.Text>
    </Modal>
  );
}

import { Card, Col, Row, Segmented, Table } from "antd";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

/** 页内可切换的视图，取值对应 query 的 type */
const VIEWS = [
  { value: "staff", labelKey: "demo.routeParam.viewStaff" },
  { value: "dept", labelKey: "demo.routeParam.viewDept" },
];

/** 员工数据视图 */
const EMPLOYEES = [
  { name: "张三", post: "前端开发", city: "杭州" },
  { name: "李四", post: "后端开发", city: "上海" },
  { name: "王五", post: "产品经理", city: "北京" },
];

/** 部门统计视图 */
const DEPT_STATS = [
  { label: "研发部", value: 42 },
  { label: "产品部", value: 18 },
  { label: "测试部", value: 15 },
  { label: "运维部", value: 9 },
];

/**
 * 路由参数
 */
export default function RouteParam() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // 当前视图由 query 的 type 决定，非法取值回退到第一个视图
  const queryType = searchParams.get("type") ?? "";
  const currentType = VIEWS.some((item) => item.value === queryType) ? queryType : VIEWS[0].value;

  return (
    <div className="page-container">
      <Card
        className="page-content"
        title={t("demo.routeParam.viewTitle")}
        variant="borderless"
        extra={<code className="route-param__query">?type={currentType}</code>}
      >
        <Segmented
          className="mb-4"
          value={currentType}
          onChange={(value) => setSearchParams({ type: String(value) })}
          options={VIEWS.map((item) => ({ label: t(item.labelKey), value: item.value }))}
        />

        {currentType === "staff" ? (
          <Table
            rowKey="name"
            size="small"
            pagination={false}
            dataSource={EMPLOYEES}
            columns={[
              { title: t("demo.routeParam.colName"), dataIndex: "name", width: 120 },
              { title: t("demo.routeParam.colPost"), dataIndex: "post" },
              { title: t("demo.routeParam.colCity"), dataIndex: "city" },
            ]}
          />
        ) : (
          <Row gutter={16}>
            {DEPT_STATS.map((item) => (
              <Col span={6} key={item.label}>
                <div className="route-param__stat">
                  <div className="route-param__stat-label">{item.label}</div>
                  <div className="route-param__stat-value">{item.value}</div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}

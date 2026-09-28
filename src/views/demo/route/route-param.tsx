import { Card, Col, Empty, Row, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import RouteInfoPanel from "./components/RouteInfoPanel";

/** 参数从数据库到页面的四步链路 */
const FLOW_NODES = [
  { labelKey: "demo.routeParam.flowDatabase", code: "sys_menu.params" },
  { labelKey: "demo.routeParam.flowBackend", code: "route.meta.params" },
  { labelKey: "demo.routeParam.flowSidebar", code: "query: meta.params" },
  { labelKey: "demo.routeParam.flowPage", code: "route.query.type" },
];

/** 两条菜单入口的对照信息 */
const ENTRIES = [
  {
    type: "1",
    menu: "路由参数(type=1)",
    path: "/route-example/params-type-1?type=1",
    params: '{ "type": "1" }',
  },
  {
    type: "2",
    menu: "路由参数(type=2)",
    path: "/route-example/params-type-2?type=2",
    params: '{ "type": "2" }',
  },
];

/** type=1 时展示的列表视图数据 */
const EMPLOYEES = [
  { name: "张三", post: "前端开发", city: "杭州" },
  { name: "李四", post: "后端开发", city: "上海" },
  { name: "王五", post: "产品经理", city: "北京" },
];

/** type=2 时展示的统计视图数据 */
const DEPT_STATS = [
  { label: "研发部", value: 42 },
  { label: "产品部", value: 18 },
  { label: "测试部", value: 15 },
  { label: "运维部", value: 9 },
];

/** 路由参数 */
export default function RouteParam() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // 当前入口携带的 type 参数
  const currentType = searchParams.get("type") ?? "";

  return (
    <div className="page-container">
      <RouteInfoPanel
        title={t("demo.routeParam.title")}
        description={t("demo.routeParam.description")}
      />

      <Card className="page-content" title={t("demo.routeParam.flowTitle")} variant="borderless">
        <div className="flex flex-wrap items-center gap-2.5">
          {FLOW_NODES.map((node, index) => (
            <span key={node.labelKey} className="flex flex-wrap items-center gap-2.5">
              <span className="route-param__flow-node">
                <span className="route-param__flow-label">{t(node.labelKey)}</span>
                <code className="route-param__flow-code">{node.code}</code>
              </span>
              {index < FLOW_NODES.length - 1 && <span className="route-param__arrow">→</span>}
            </span>
          ))}
        </div>

        <Row gutter={16} className="mt-4">
          {ENTRIES.map((entry) => (
            <Col span={12} key={entry.type}>
              <div
                className={`route-param__entry${currentType === entry.type ? " is-active" : ""}`}
              >
                <div className="flex-x-between mb-2">
                  <span className="route-param__entry-menu">
                    {t("demo.routeParam.entryMenu", { menu: entry.menu })}
                  </span>
                  {currentType === entry.type && (
                    <Tag color="success">{t("demo.routeParam.entryCurrent")}</Tag>
                  )}
                </div>
                <div className="route-param__entry-line">{entry.path}</div>
                <div className="route-param__entry-line">
                  {t("demo.routeParam.entryParams", { params: entry.params })}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        className="page-content mt-4"
        title={t("demo.routeParam.viewTitle")}
        variant="borderless"
      >
        {currentType === "1" ? (
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
        ) : currentType === "2" ? (
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
        ) : (
          <Empty description={t("demo.routeParam.viewEmpty")} />
        )}
      </Card>
    </div>
  );
}

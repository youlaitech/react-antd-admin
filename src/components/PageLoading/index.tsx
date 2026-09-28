import { Spin } from "antd";

/**
 * 路由懒加载与权限校验期间的加载态
 */
export default function PageLoading() {
  return (
    <div className="flex-center wh-full min-h-200px">
      <Spin size="large" />
    </div>
  );
}

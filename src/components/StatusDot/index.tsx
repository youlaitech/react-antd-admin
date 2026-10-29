import "./index.scss";

interface StatusDotProps {
  /** 是否处于启用状态 */
  active: boolean;
}

/**
 * 状态圆点：启用为成功色，停用为占位色
 */
export default function StatusDot({ active }: StatusDotProps) {
  return <span className={`status-dot${active ? "" : " is-stopped"}`} />;
}

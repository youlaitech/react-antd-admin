interface SectionTitleProps {
  /** 分区标题 */
  title: string;
  /** 标题右侧说明 */
  tip?: string;
}

/**
 * 分区标题
 */
export default function SectionTitle({ title, tip }: SectionTitleProps) {
  return (
    <div className="section-title">
      <span>{title}</span>
      {tip && <span className="section-title__tip">{tip}</span>}
    </div>
  );
}

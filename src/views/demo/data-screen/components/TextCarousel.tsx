import { useState } from "react";

import { useKeepTicking } from "../hooks/useKeepTicking";

// 所有轮播数据
const carouselData = [
  "全国新能源车在线数量：125945 辆，当前充电中车辆占比 36%",
  "今日新增行程 67454 公里，减少碳排放 1120 吨",
  "合肥充电需求飙升！当前 1258 辆车排队等待充电",
  "实时处理电池异常告警 52 例，安全响应率99.8%",
  "安徽车辆在线率突破 82%，续航达标率行业领先",
  "10分钟内完成2510次远程诊断，高效护航出行",
];

/**
 * 文字轮播：定时切换展示项
 */
export default function TextCarousel() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useKeepTicking(() => {
    setCurrentIdx((index) => (index + 1) % carouselData.length);
  }, 5000);

  return (
    <div className="text-carousel">
      <div className="carousel-container">
        <div key={currentIdx} className="text-carousel-item">
          {carouselData[currentIdx]}
        </div>
      </div>
    </div>
  );
}

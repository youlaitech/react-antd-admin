import BatteryHealth from "./BatteryHealth";
import MileageEnergyConsumption from "./MileageEnergyConsumption";
import RealTimeAlarm from "./RealTimeAlarm";
import RealTimeOperation from "./RealTimeOperation";

/**
 * 大屏右栏：告警、运行监控、里程能耗与电池健康度
 */
export default function RightCharts() {
  return (
    <div className="rightChart">
      {/* 实时告警看板 */}
      <RealTimeAlarm />
      {/* 实时运行监控 */}
      <RealTimeOperation />
      {/* 里程与能耗分析 */}
      <MileageEnergyConsumption />
      {/* 电池健康度 */}
      <BatteryHealth />
    </div>
  );
}

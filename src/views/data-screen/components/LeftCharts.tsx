import RealTimeStatus from "./RealTimeStatus";
import RegionalOperation from "./RegionalOperation";
import VehicleDistribution from "./VehicleDistribution";

/**
 * 大屏左栏：实时状态、车辆分布与区域运营
 */
export default function LeftCharts() {
  return (
    <div className="leftChart">
      {/* 车辆实时状态 */}
      <RealTimeStatus />

      {/* 车辆分布 */}
      <VehicleDistribution />

      {/* 区域运营 */}
      <RegionalOperation />
    </div>
  );
}

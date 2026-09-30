import TextCarousel from "./TextCarousel";
import VehicleChargingChart from "./VehicleChargingChart";

/**
 * 大屏中栏：文字轮播与车辆充电统计
 */
export default function CenterCharts() {
  return (
    <div className="centerChart">
      {/* 文字滚动 */}
      <TextCarousel />
      <div className="vehicleCharging">
        {/* 充电数据 */}
        <VehicleChargingChart />
      </div>
    </div>
  );
}

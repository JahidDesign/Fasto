import React from "react";
import ReactApexChart from "react-apexcharts";

class ApexLine5 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      series: [
        {
          name: "Recovered Patient",
          data: [500, 230, 600, 360, 700, 890, 750, 420, 600, 300, 420, 220],
        },
        {
          name: "New Patient",
          data: [250, 380, 200, 300, 200, 520, 380, 770, 250, 520, 300, 900],
        },
      ],
      options: {
        chart: {
          height: 350,
          type: "area",
          group: "social",
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: [2, 2],
          colors: ["#EB8153", "#2BC155"],
          curve: "straight",
        },
        legend: {
          show: false          
        },
        markers: {
          size: 6,
          border: 0,
          colors: ["#EB8153", "#2BC155"],
          hover: {
            size: 6,
          },
        },
        xaxis: {
          categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul",
            "Aug","Sep","Oct","Nov","Dec","10 Jan","11 Jan","12 Jan",
          ],
          labels: {
            style: {
              colors: '#636363',
            }
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: '#636363',
            }
          },
        },
        fill: {
          colors: ["#EB8153", "#2BC155"],
          type: "solid",
          opacity: 0.07,
        },
        grid: {
          borderColor: "#f1f1f1",
        },
      },
    };
  }

  render() {
    return (
      <div id="chart" className="line-chart-style bar-chart market-line">
        <ReactApexChart
          options={this.state.options}
          series={this.state.series}
          type="area"
          height={350}
        />
      </div>
    );
  }
}

export default ApexLine5;

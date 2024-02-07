// import 'package:flutter/material.dart';
// import 'package:fl_chart/fl_chart.dart';

// class RemainingTimeChart extends StatefulWidget {
//   const RemainingTimeChart({super.key});

//   @override
//   _RemainingTimeChartState createState() => _RemainingTimeChartState();
// }

// class _RemainingTimeChartState extends State<RemainingTimeChart> {
//   final List<FlSpot> _dataPoints = [];

//   @override
//   void initState() {
//     super.initState();
//     _generateDataPoints();
//   }

//   void _generateDataPoints() {
//     DateTime now = DateTime.now();
//     DateTime end = now.add(const Duration(days: 365));

//     // Choose an appropriate interval based on your desired granularity:
//     int interval = 24; // Hours (for a high-resolution daily line chart)

//     for (int i = 0; i < 365 * interval; i++) {
//       DateTime pointTime = now.add(Duration(hours: i * interval));
//       Duration remainingTime = end.difference(pointTime);
//       double remainingDays = remainingTime.inDays.toDouble();

//       _dataPoints.add(FlSpot(i.toDouble(), remainingDays));
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return SizedBox(
//       width: double.infinity,
//       height: 300,
//       child: LineChart(
//         LineChartData(
//           titles: const {
//             leftTitles: AxisTitles(sideTitles: SideTitles(showLabels: false)),
//             bottomTitles: AxisTitles(
//               sideTitles: SideTitles(
//                 showLabels: true,
//                 interval: 60, // Display labels every 60 days
//                 getTitles: (value) => DateFormat('MMM dd')
//                     .format(DateTime.now().add(Duration(days: value.toInt()))),
//               ),
//             ),
//           },
//           gridData: const FlGridData(
//             showHorizontalLines: true,
//             drawVerticalGrid: false,
//           ),
//           lineBarsData: [
//             LineChartBarData(
//               spots: _dataPoints,
//               colors: [Colors.blue],
//               barWidth: 2,
//               isCurved: true,
//               dotData: const DotData(show: false),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

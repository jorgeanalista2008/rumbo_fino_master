class RideModel {
  final String id;
  final String passengerId;
  final String? driverId;
  final String status;
  final String originAddress;
  final double originLatitude;
  final double originLongitude;
  final String destinationAddress;
  final double destinationLatitude;
  final double destinationLongitude;
  final double estimatedFareUsd;
  final double? finalFareUsd;
  final double exchangeRateBcv;
  final String category;
  final String? driverName;
  final String? driverPhone;
  final String? vehicleModel;
  final String? vehiclePlate;
  final String? vehicleColor;
  final DateTime createdAt;

  RideModel({
    required this.id,
    required this.passengerId,
    this.driverId,
    required this.status,
    required this.originAddress,
    required this.originLatitude,
    required this.originLongitude,
    required this.destinationAddress,
    required this.destinationLatitude,
    required this.destinationLongitude,
    required this.estimatedFareUsd,
    this.finalFareUsd,
    this.exchangeRateBcv = 64.85,
    required this.category,
    this.driverName,
    this.driverPhone,
    this.vehicleModel,
    this.vehiclePlate,
    this.vehicleColor,
    required this.createdAt,
  });

  factory RideModel.fromJson(Map<String, dynamic> json) {
    return RideModel(
      id: json['id'] ?? '',
      passengerId: json['passengerId'] ?? '',
      driverId: json['driverId'],
      status: json['status'] ?? 'SOLICITADO',
      originAddress: json['originAddress'] ?? 'Ubicación Actual',
      originLatitude: (json['originLatitude'] as num?)?.toDouble() ?? 10.4900,
      originLongitude: (json['originLongitude'] as num?)?.toDouble() ?? -66.8600,
      destinationAddress: json['destinationAddress'] ?? 'Destino Ejecutivo',
      destinationLongitude: (json['destinationLongitude'] as num?)?.toDouble() ?? -66.8500,
      destinationLatitude: (json['destinationLatitude'] as num?)?.toDouble() ?? 10.4950,
      estimatedFareUsd: (json['estimatedFareUsd'] as num?)?.toDouble() ?? 25.0,
      finalFareUsd: (json['finalFareUsd'] as num?)?.toDouble(),
      exchangeRateBcv: (json['exchangeRateBcv'] as num?)?.toDouble() ?? 64.85,
      category: json['category'] ?? 'SEDAN_EJECUTIVO',
      driverName: json['driver']?['user'] != null
          ? '${json['driver']['user']['firstName']} ${json['driver']['user']['lastName']}'
          : json['driverName'],
      driverPhone: json['driver']?['user']?['phoneNumber'] ?? json['driverPhone'],
      vehicleModel: json['driver']?['vehicle']?['model'] ?? json['vehicleModel'],
      vehiclePlate: json['driver']?['vehicle']?['plate'] ?? json['vehiclePlate'],
      vehicleColor: json['driver']?['vehicle']?['color'] ?? json['vehicleColor'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

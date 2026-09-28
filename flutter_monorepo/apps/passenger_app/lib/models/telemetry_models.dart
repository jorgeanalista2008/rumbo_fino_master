class ExchangeRateModel {
  final String id;
  final String currencyPair;
  final double rate;
  final String source;
  final DateTime effectiveDate;

  ExchangeRateModel({
    required this.id,
    required this.currencyPair,
    required this.rate,
    required this.source,
    required this.effectiveDate,
  });

  factory ExchangeRateModel.fromJson(Map<String, dynamic> json) {
    return ExchangeRateModel(
      id: json['id'] ?? '',
      currencyPair: json['currencyPair'] ?? 'USD_VES',
      rate: (json['rate'] as num?)?.toDouble() ?? 64.85,
      source: json['source'] ?? 'BCV_OFFICIAL',
      effectiveDate: json['effectiveDate'] != null
          ? DateTime.parse(json['effectiveDate'])
          : DateTime.now(),
    );
  }
}

class DriverLocationModel {
  final String driverId;
  final String name;
  final double latitude;
  final double longitude;
  final double heading;
  final String vehicleModel;
  final String plate;
  final String category;

  DriverLocationModel({
    required this.driverId,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.heading = 0.0,
    required this.vehicleModel,
    required this.plate,
    this.category = 'SEDAN_EJECUTIVO',
  });

  factory DriverLocationModel.fromJson(Map<String, dynamic> json) {
    return DriverLocationModel(
      driverId: json['driverId'] ?? json['id'] ?? '',
      name: json['name'] ?? json['user']?['firstName'] ?? 'Chofer Ejecutivo',
      latitude: (json['latitude'] ?? json['lat'] as num?)?.toDouble() ?? 10.4900,
      longitude: (json['longitude'] ?? json['lng'] as num?)?.toDouble() ?? -66.8600,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      vehicleModel: json['vehicle']?['model'] ?? json['vehicleModel'] ?? 'Mercedes-Benz E-Class',
      plate: json['vehicle']?['plate'] ?? json['plate'] ?? 'RF-8825',
      category: json['vehicle']?['category'] ?? json['category'] ?? 'SEDAN_EJECUTIVO',
    );
  }
}

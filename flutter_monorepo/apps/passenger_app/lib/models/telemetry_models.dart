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
    final rawRate = json['rate'];
    final parsedRate = (rawRate is num)
        ? rawRate.toDouble()
        : (double.tryParse(rawRate?.toString() ?? '') ?? 875.0);

    return ExchangeRateModel(
      id: json['id']?.toString() ?? '',
      currencyPair: json['currencyPair']?.toString() ?? 'USD_VES',
      rate: parsedRate,
      source: json['source']?.toString() ?? 'BCV_OFFICIAL',
      effectiveDate: json['effectiveDate'] != null
          ? DateTime.tryParse(json['effectiveDate'].toString()) ?? DateTime.now()
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
  final double speed;
  final String vehicleModel;
  final String plate;
  final String category;

  DriverLocationModel({
    required this.driverId,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.heading = 0.0,
    this.speed = 0.0,
    required this.vehicleModel,
    required this.plate,
    this.category = 'EXECUTIVE_SEDAN',
  });

  static double _parseDouble(dynamic val, [double defaultVal = 0.0]) {
    if (val == null) return defaultVal;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? defaultVal;
  }

  factory DriverLocationModel.fromJson(Map<String, dynamic> json) {
    String dName = 'Chofer';
    if (json['user'] is Map<String, dynamic>) {
      final fName = json['user']['firstName'] ?? '';
      final lName = json['user']['lastName'] ?? '';
      final full = '$fName $lName'.trim();
      if (full.isNotEmpty) dName = full;
    } else if (json['name'] != null && json['name'].toString().isNotEmpty) {
      dName = json['name'].toString();
    }

    String vModel = '';
    String vPlate = '';
    String vCat = 'EXECUTIVE_SEDAN';

    final vehicle = json['currentVehicle'] ?? json['vehicle'];
    if (vehicle is Map<String, dynamic>) {
      vModel = [vehicle['make'], vehicle['model']].where((e) => e != null).join(' ');
      vPlate = vehicle['licensePlate'] ?? vehicle['plateNumber'] ?? '';
      vCat = vehicle['category'] ?? 'EXECUTIVE_SEDAN';
    } else {
      vModel = json['vehicleModel']?.toString() ?? '';
      vPlate = json['plate']?.toString() ?? json['licensePlate']?.toString() ?? '';
      vCat = json['category']?.toString() ?? 'EXECUTIVE_SEDAN';
    }

    return DriverLocationModel(
      driverId: json['driverId']?.toString() ?? json['id']?.toString() ?? '',
      name: dName,
      latitude: _parseDouble(json['latitude'] ?? json['lat']),
      longitude: _parseDouble(json['longitude'] ?? json['lng']),
      heading: _parseDouble(json['heading']),
      speed: _parseDouble(json['speed']),
      vehicleModel: vModel.isNotEmpty ? vModel : 'Vehículo Ejecutivo',
      plate: vPlate,
      category: vCat,
    );
  }
}

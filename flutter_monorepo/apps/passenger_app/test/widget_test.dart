import 'package:flutter_test/flutter_test.dart';
import 'package:passenger_app/main.dart';

void main() {
  testWidgets('Rumbo Fino Passenger App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const RumboFinoPassengerApp());
    expect(find.byType(RumboFinoPassengerApp), findsOneWidget);
  });
}

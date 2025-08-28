import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-6">
      {/* Main Content Container */}
      <View className="items-center space-y-8">
        
        {/* Logo/Icon Section */}
        <View className="items-center mb-4">
          <View className="w-24 h-24 bg-teal-100 rounded-full justify-center items-center mb-6">
            <Text className="text-4xl">💧</Text>
          </View>
        </View>

        {/* Text Content */}
        <View className="items-center space-y-4">
          <Text className="text-3xl font-semibold text-teal-700 text-center">
            Welcome to
          </Text>
          <Text className="text-5xl font-bold text-teal-800 text-center leading-tight">
            Smart IV Drip Monitor
          </Text>
          <Text className="text-lg text-gray-600 text-center mt-4 px-4">
            Real-time monitoring for intravenous therapy
          </Text>
        </View>

        {/* Connect Button */}
        <View className="mt-12">
          <Link 
            href="/connect" 
            className="bg-teal-600 px-8 py-4 rounded-full shadow-lg shadow-teal-200"
          >
            <Text className="text-white text-lg font-semibold">
              Get Started
            </Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

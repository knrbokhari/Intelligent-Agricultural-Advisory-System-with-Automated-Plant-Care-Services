import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Index() {
  const healthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: () => api.get<string>("/"),
  });

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-5xl font-bold text-primary">
        Welcome to Nativewind!
      </Text>
      <Text className="mt-4 text-primary">
        {healthQuery.isPending
          ? "Connecting to API..."
          : healthQuery.isError
            ? "API unavailable"
            : healthQuery.data}
      </Text>
    </View>
  );
}

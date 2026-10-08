import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/auth";

const SignUp = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [conformPassword, setConformPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationStarted, setVerificationStarted] = useState(false);

  // Validation states
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [conformPasswordTouched, setConformPasswordTouched] = useState(false);

  // Client-side validation
  const fullNameValid = fullName.length >= 2;
  const emailValid =
    emailAddress.length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
  const passwordValid = password.length === 0 || password.length >= 8;
  const conformPasswordValid =
    conformPassword.length === 0 || conformPassword === password;
  const formValid =
    fullNameValid &&
    emailAddress.length > 0 &&
    password.length >= 8 &&
    emailValid &&
    conformPasswordValid;

  const handleSubmit = async () => {
    if (!formValid) return;

    setIsVerifying(true);
    setErrorMessage("");
    try {
     const res = await authApi.register(fullName.trim(), emailAddress.trim(), password);
     console.log(res)
      setVerificationStarted(true);
    } catch (error) {
        console.log(error)
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsVerifying(true);
    setErrorMessage("");
    try {
      await authApi.verifyEmail(emailAddress.trim(), code);
      router.replace("/(auth)/sign-in");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Unable to verify your email. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Show verification screen if email needs verification
  if (verificationStarted) {
    return (
      <RNSafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="auth-screen"
        >
          <ScrollView
            className="auth-scroll"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="auth-content">
              {/* Branding */}
              <View className="auth-brand-block">
                <View className="auth-logo-wrap">
                  <View className="auth-logo-mark">
                    <Text className="auth-logo-mark-text">R</Text>
                  </View>
                  <View>
                    <Text className="auth-wordmark">AgriGuide</Text>
                    <Text className="auth-wordmark-sub">Smart Plant Care</Text>
                  </View>
                </View>
                <Text className="auth-title">Verify your email</Text>
                <Text className="auth-subtitle">
                  We sent a verification code to {emailAddress}
                </Text>
              </View>

              {/* Verification Form */}
              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Verification Code</Text>
                    <TextInput
                      className="auth-input"
                      value={code}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="rgba(0, 0, 0, 0.4)"
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      maxLength={6}
                    />
                    {errorMessage && (
                      <Text className="auth-error">{errorMessage}</Text>
                    )}
                  </View>

                  <Pressable
                    className={`auth-button ${(!code || isVerifying) && "auth-button-disabled"}`}
                    onPress={handleVerify}
                    disabled={!code || isVerifying}
                  >
                    <Text className="auth-button-text">
                      {isVerifying ? "Verifying..." : "Verify Email"}
                    </Text>
                  </Pressable>

                  <Pressable
                    className="auth-secondary-button"
                    onPress={async () => {
                      setErrorMessage("");
                      try {
                        await authApi.resendVerificationOtp(
                          emailAddress.trim(),
                        );
                      } catch (error) {
                        setErrorMessage(
                          error instanceof ApiError
                            ? error.message
                            : "Unable to resend the code. Please try again.",
                        );
                      }
                    }}
                    disabled={isVerifying}
                  >
                    <Text className="auth-secondary-button-text">
                      Resend Code
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </RNSafeAreaView>
    );
  }

  // Main sign-up form
  return (
    <RNSafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            {/* Branding */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">AgriGuide</Text>
                  <Text className="auth-wordmark-sub">Smart Plant Care</Text>
                </View>
              </View>
              <Text className="auth-title">Create your account</Text>
              <Text className="auth-subtitle">
                Start tracking your plants with the help of AgriGuide and get
                personalized care recommendations
              </Text>
            </View>

            {/* Sign-Up Form */}
            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Full Name</Text>
                  <TextInput
                    className={`auth-input ${fullNameTouched && !fullNameValid && "auth-input-error"}`}
                    autoCapitalize="none"
                    value={fullName}
                    placeholder="John Doe"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    onChangeText={setFullName}
                    onBlur={() => setFullNameTouched(true)}
                    keyboardType="default"
                    autoComplete="name"
                  />
                  {fullNameTouched && !fullNameValid && (
                    <Text className="auth-error">
                      Please enter a valid full name
                    </Text>
                  )}
                </View>
                <View className="auth-field">
                  <Text className="auth-label">Email Address</Text>
                  <TextInput
                    className={`auth-input ${emailTouched && !emailValid && "auth-input-error"}`}
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="name@example.com"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    onChangeText={setEmailAddress}
                    onBlur={() => setEmailTouched(true)}
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  {emailTouched && !emailValid && (
                    <Text className="auth-error">
                      Please enter a valid email address
                    </Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={`auth-input ${passwordTouched && !passwordValid && "auth-input-error"}`}
                    value={password}
                    placeholder="Create a strong password"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    secureTextEntry
                    onChangeText={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                    autoComplete="password-new"
                  />
                  {passwordTouched && !passwordValid && (
                    <Text className="auth-error">
                      Password must be at least 8 characters
                    </Text>
                  )}
                  {!passwordTouched && (
                    <Text className="auth-helper">
                      Minimum 8 characters required
                    </Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Confirm Password</Text>
                  <TextInput
                    className={`auth-input ${conformPasswordTouched && !conformPasswordValid && "auth-input-error"}`}
                    value={conformPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    secureTextEntry
                    onChangeText={setConformPassword}
                    onBlur={() => setConformPasswordTouched(true)}
                    autoComplete="password-new"
                  />
                  {conformPasswordTouched && !conformPasswordValid && (
                    <Text className="auth-error">Passwords do not match</Text>
                  )}
                </View>

                {errorMessage && (
                  <Text className="auth-error">{errorMessage}</Text>
                )}

                <Pressable
                  className={`auth-button ${(!formValid || isVerifying) && "auth-button-disabled"}`}
                  onPress={handleSubmit}
                  disabled={!formValid || isVerifying}
                >
                  <Text className="auth-button-text">
                    {isVerifying ? "Creating Account..." : "Create Account"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sign-In Link */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">Already have an account?</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text className="auth-link">Sign In</Text>
                </Pressable>
              </Link>
            </View>

            {/* Required for Clerk's bot protection */}
            <View nativeID="clerk-captcha" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RNSafeAreaView>
  );
};

export default SignUp;

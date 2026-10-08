import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/lib/api';
import { authApi, tokenStorage } from '@/lib/auth';

const SignIn = () => {
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Validation states
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);

    // Client-side validation
    const emailValid = emailAddress.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
    const passwordValid = password.length > 0;
    const formValid = emailAddress.length > 0 && password.length > 0 && emailValid;

    const handleSubmit = async () => {
        if (!formValid) return;

        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await authApi.login(emailAddress.trim(), password);
            await tokenStorage.set(response.accessToken);
            router.replace('/(tabs)');
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Main sign-in form
    return (
        <RNSafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                            <Text className="auth-title">Welcome back</Text>
                            <Text className="auth-subtitle">
                                Sign in to continue managing your plants
                            </Text>
                        </View>

                        {/* Sign-In Form */}
                        <View className="auth-card">
                            <View className="auth-form">
                                <View className="auth-field">
                                    <Text className="auth-label">Email Address</Text>
                                    <TextInput
                                        className={`auth-input ${emailTouched && !emailValid && 'auth-input-error'}`}
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
                                        <Text className="auth-error">Please enter a valid email address</Text>
                                    )}
                                    {errorMessage && <Text className="auth-error">{errorMessage}</Text>}
                                </View>

                                <View className="auth-field">
                                    <Text className="auth-label">Password</Text>
                                    <TextInput
                                        className={`auth-input ${passwordTouched && !passwordValid && 'auth-input-error'}`}
                                        value={password}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                        secureTextEntry
                                        onChangeText={setPassword}
                                        onBlur={() => setPasswordTouched(true)}
                                        autoComplete="password"
                                    />
                                    {passwordTouched && !passwordValid && (
                                        <Text className="auth-error">Password is required</Text>
                                    )}
                                </View>

                                <Pressable
                                    className={`auth-button ${(!formValid || isSubmitting) && 'auth-button-disabled'}`}
                                    onPress={handleSubmit}
                                    disabled={!formValid || isSubmitting}
                                >
                                    <Text className="auth-button-text">
                                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Sign-Up Link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don&apos;t have an account?</Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <Pressable>
                                    <Text className="auth-link">Create Account</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </RNSafeAreaView>
    );
};

export default SignIn;
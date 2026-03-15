import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  requestNotificationPermissions, 
  openBatterySettings, 
  setOnboardingCompleted 
} from '@/services/permissions';

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: string;
  granted: boolean;
  action: () => Promise<void>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      title: 'الإشعارات',
      description: 'لإرسال تذكير دوري لمراجعة أحلامك',
      icon: 'notifications-active',
      granted: false,
      action: async () => {
        const granted = await requestNotificationPermissions();
        updatePermission('notifications', granted);
        return;
      },
    },
    {
      id: 'battery',
      title: 'العمل في الخلفية',
      description: 'لمنع النظام من إيقاف التطبيق',
      icon: 'battery-charging-full',
      granted: false,
      action: async () => {
        openBatterySettings();
        updatePermission('battery', true);
        return;
      },
    },
  ]);

  const updatePermission = (id: string, granted: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, granted } : p))
    );
  };

  const handleContinue = async () => {
    await setOnboardingCompleted();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await setOnboardingCompleted();
    router.replace('/(tabs)');
  };

  const allGranted = permissions.every((p) => p.granted);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1A0033', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="nightlight-round" size={72} color={theme.colors.primary} />
          <Text style={styles.title}>DreamRecall</Text>
          <Text style={styles.subtitle}>مرحباً بك في تطبيق تدوين الأحلام</Text>
        </View>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoText}>
            لضمان تجربة مثالية، نحتاج بعض الصلاحيات الضرورية:
          </Text>
        </GlassCard>

        <View style={styles.permissionsContainer}>
          {permissions.map((permission) => (
            <Pressable
              key={permission.id}
              style={[
                styles.permissionCard,
                permission.granted && styles.permissionCardGranted,
              ]}
              onPress={permission.action}
            >
              <View style={styles.permissionIcon}>
                <MaterialIcons
                  name={permission.icon as any}
                  size={32}
                  color={permission.granted ? theme.colors.success : theme.colors.primary}
                />
              </View>
              
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>{permission.title}</Text>
                <Text style={styles.permissionDescription}>{permission.description}</Text>
              </View>

              <View style={styles.permissionStatus}>
                {permission.granted ? (
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.success} />
                ) : (
                  <MaterialIcons name="arrow-forward-ios" size={20} color={theme.colors.textTertiary} />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <GlassCard style={styles.noteCard}>
          <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.noteText}>
            يمكنك تخطي هذه الخطوة، لكن التطبيق قد لا يعمل بالشكل الأمثل في الخلفية
          </Text>
        </GlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {allGranted ? (
          <Pressable style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>ابدأ الآن</Text>
            <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.footerButtons}>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>تخطي</Text>
            </Pressable>
            <Pressable 
              style={[styles.continueButton, styles.continueButtonDisabled]} 
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>متابعة</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: theme.spacing.xl,
  },
  infoText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  permissionsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  permissionCardGranted: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(106, 0, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  permissionStatus: {
    marginRight: theme.spacing.sm,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(106, 0, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(106, 0, 255, 0.3)',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  skipButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textSecondary,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
  },
});

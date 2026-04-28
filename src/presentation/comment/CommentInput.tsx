import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { circle, colors, radii, sizes, spacing, typography } from '@/shared/theme';

type CommentInputProps = {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
};

const KEYBOARD_OFFSET = 100;
const COMMENT_MAX_LENGTH = 500;

export function CommentInput({ onSubmit, isLoading }: CommentInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={KEYBOARD_OFFSET}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Написать комментарий..."
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={COMMENT_MAX_LENGTH}
          editable={!isLoading}
        />
        <Pressable
          style={[styles.button, !text.trim() && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim() || isLoading}
        >
          <Text style={styles.buttonText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: sizes.inputMaxHeight,
  },
  button: {
    width: sizes.iconButton,
    height: sizes.iconButton,
    borderRadius: circle(sizes.iconButton),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  buttonText: {
    ...typography.buttonGlyph,
    color: colors.white,
  },
});

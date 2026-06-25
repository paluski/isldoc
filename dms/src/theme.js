import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  defaultRadius: 'md',
  fontFamily: 'Inter, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, monospace',
  headings: {
    fontFamily: 'Inter, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontWeight: '650'
  },
  colors: {
    brand: [
      '#eef1ff',
      '#dfe3fb',
      '#bcc3f2',
      '#97a2e9',
      '#7886e2',
      '#6373dd',
      '#5566d8',
      '#4555c0',
      '#3b4bac',
      '#2c3a8f'
    ],
    gray: [
      '#f8f9fb',
      '#f1f2f5',
      '#e6e8ec',
      '#d6d9e0',
      '#b9bcc7',
      '#9498a7',
      '#717586',
      '#565a6b',
      '#3d4052',
      '#272a38'
    ]
  },
  shadows: {
    xs: '0 1px 2px rgba(20, 22, 40, 0.04)',
    sm: '0 2px 8px rgba(20, 22, 40, 0.06)',
    md: '0 6px 16px rgba(20, 22, 40, 0.08)',
    lg: '0 12px 28px rgba(20, 22, 40, 0.10)',
    xl: '0 20px 44px rgba(20, 22, 40, 0.12)'
  },
  radius: {
    xs: rem(6),
    sm: rem(8),
    md: rem(10),
    lg: rem(14),
    xl: rem(20)
  },
  components: {
    Card: {
      defaultProps: { radius: 'lg', shadow: 'sm', withBorder: true }
    },
    Paper: {
      defaultProps: { radius: 'lg' }
    },
    Modal: {
      defaultProps: { radius: 'lg', shadow: 'xl', overlayProps: { backgroundOpacity: 0.45, blur: 3 } }
    },
    Button: {
      defaultProps: { radius: 'md' }
    },
    TextInput: { defaultProps: { radius: 'md' } },
    NumberInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    Textarea: { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    FileInput: { defaultProps: { radius: 'md' } },
    Badge: { defaultProps: { radius: 'sm' } },
    ActionIcon: { defaultProps: { radius: 'md' } },
    Table: {
      defaultProps: { verticalSpacing: 'sm', horizontalSpacing: 'md' }
    },
    AppShell: {
      styles: {
        main: { backgroundColor: 'var(--mantine-color-body)' }
      }
    }
  }
});

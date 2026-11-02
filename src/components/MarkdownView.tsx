// TypeScript / src/components/MarkdownView.tsx / Expo React Native / Lightweight Zero-Dependency Markdown Renderer for Release Changelogs

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownViewProps {
  content: string;
  accentColor?: string;
}

export function MarkdownView({ content, accentColor = '#B69DF8' }: MarkdownViewProps) {
  if (!content || !content.trim()) return null;

  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trimEnd();

        // 1. Heading 1 (# ...)
        if (line.startsWith('# ')) {
          return (
            <Text key={index} style={[styles.h1, { color: '#FFF' }]}>
              {line.replace(/^#\s+/, '')}
            </Text>
          );
        }

        // 2. Heading 2 (## ...)
        if (line.startsWith('## ')) {
          return (
            <Text key={index} style={[styles.h2, { color: '#FFF' }]}>
              {line.replace(/^##\s+/, '')}
            </Text>
          );
        }

        // 3. Heading 3 (### ...)
        if (line.startsWith('### ')) {
          return (
            <Text key={index} style={[styles.h3, { color: accentColor }]}>
              {line.replace(/^###\s+/, '')}
            </Text>
          );
        }

        // 4. Bullet point (* ... or - ...)
        if (/^[\*\-]\s+/.test(line)) {
          const bulletText = line.replace(/^[\*\-]\s+/, '');
          return (
            <View key={index} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
              <View style={{ flex: 1 }}>{renderFormattedText(bulletText, accentColor)}</View>
            </View>
          );
        }

        // 5. Empty line spacer
        if (!line.trim()) {
          return <View key={index} style={styles.spacer} />;
        }

        // 6. Regular paragraph with bold / code parsing
        return (
          <View key={index} style={styles.paragraphRow}>
            {renderFormattedText(line, accentColor)}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Phân tích các định dạng nội dòng: **in đậm**, `mã code`, link
 */
function renderFormattedText(text: string, accentColor: string) {
  // Regex khớp **in đậm** hoặc `code`
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return (
    <Text style={styles.bodyText}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <Text key={i} style={styles.boldText}>
              {boldText}
            </Text>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeText = part.slice(1, -1);
          return (
            <Text key={i} style={[styles.codeText, { color: accentColor }]}>
              {` ${codeText} `}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: -0.2
  },
  h2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4
  },
  h3: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 3
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7
  },
  paragraphRow: {
    marginVertical: 2
  },
  bodyText: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 19
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  codeText: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600'
  },
  spacer: {
    height: 6
  }
});

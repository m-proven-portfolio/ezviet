/**
 * Sample Book Fixture
 *
 * Demonstrates all block types and serves as a test fixture.
 * "Vietnamese for Beginners: Greetings & Introductions"
 */

import type { BookDocument } from '../types';

export const SAMPLE_BOOK: BookDocument = {
  meta: {
    id: 'sample-001',
    slug: 'vietnamese-greetings-beginner',
    title: 'Vietnamese for Beginners',
    subtitle: 'Greetings & Introductions',
    author: 'EZViet Team',
    description: 'Learn essential Vietnamese greetings and how to introduce yourself.',

    languages: {
      baseLang: 'en',
      targetLang: 'vi',
      targetRegion: 'south',
    },
    level: 'A1',

    trimSize: 'kdp-6x9',
    templateId: 'ezviet',

    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  frontMatter: {
    titlePage: true,
    tableOfContents: true,
    copyright: '© 2025 EZViet. All rights reserved.',
    howToUse: [
      {
        id: 'how-1',
        type: 'paragraph',
        content: [
          { text: 'This book is designed for absolute beginners learning Vietnamese. Each chapter introduces new vocabulary and provides practice exercises.' },
        ],
      },
      {
        id: 'how-2',
        type: 'callout',
        title: 'Audio Available',
        content: [
          { text: 'Look for the 🔊 symbol to access audio pronunciation on our website at ezviet.com/audio' },
        ],
        variant: 'info',
      },
    ],
  },

  chapters: [
    {
      id: 'ch-1',
      number: 1,
      title: 'Xin Chào! Hello!',
      subtitle: 'Basic Greetings',
      objectives: [
        'Learn common greeting phrases',
        'Understand Vietnamese tones',
        'Practice introducing yourself',
      ],
      sections: [
        {
          id: 'sec-1-1',
          title: 'Essential Greetings',
          blocks: [
            {
              id: 'blk-1',
              type: 'paragraph',
              content: [
                { text: 'Vietnamese greetings are essential for daily communication. Unlike English, Vietnamese uses different greetings based on the ' },
                { text: 'time of day', marks: ['bold'] },
                { text: ' and the ' },
                { text: 'relationship', marks: ['bold'] },
                { text: ' between speakers.' },
              ],
            },
            {
              id: 'blk-2',
              type: 'vocabulary',
              targetText: 'Xin chào',
              baseText: 'Hello (formal)',
              romanization: 'sin chào',
              size: 'large',
            },
            {
              id: 'blk-3',
              type: 'vocabulary',
              targetText: 'Chào',
              baseText: 'Hi (informal)',
              romanization: 'chào',
            },
            {
              id: 'blk-4',
              type: 'grammar-note',
              title: 'Formality in Vietnamese',
              content: [
                { text: '"Xin chào" is more formal and polite. "Chào" alone is casual, used with friends and peers.' },
              ],
              examples: [
                { targetText: 'Xin chào cô', baseText: 'Hello, ma\'am (to a woman older than you)' },
                { targetText: 'Chào bạn', baseText: 'Hi, friend' },
              ],
              variant: 'info',
            },
            {
              id: 'blk-5',
              type: 'section-break',
              style: 'ornament',
            },
            {
              id: 'blk-6',
              type: 'heading',
              level: 3,
              content: 'More Greetings',
            },
            {
              id: 'blk-7',
              type: 'vocabulary-list',
              title: 'Time-based Greetings',
              columns: 2,
              items: [
                { targetText: 'Chào buổi sáng', baseText: 'Good morning' },
                { targetText: 'Chào buổi chiều', baseText: 'Good afternoon' },
                { targetText: 'Chào buổi tối', baseText: 'Good evening' },
                { targetText: 'Chúc ngủ ngon', baseText: 'Good night' },
              ],
            },
          ],
        },
        {
          id: 'sec-1-2',
          title: 'Vietnamese Tones',
          blocks: [
            {
              id: 'blk-8',
              type: 'paragraph',
              content: [
                { text: 'Vietnamese is a ' },
                { text: 'tonal language', marks: ['bold'] },
                { text: ' with six tones. The same syllable can have completely different meanings depending on the tone used.' },
              ],
            },
            {
              id: 'blk-9',
              type: 'tone-chart',
              word: 'ma',
              showAllTones: true,
            },
            {
              id: 'blk-10',
              type: 'cultural-note',
              title: 'Don\'t Worry About Mistakes',
              content: [
                { text: 'Vietnamese people are very forgiving of tone mistakes from learners. They appreciate the effort to speak their language and will usually understand from context.' },
              ],
            },
          ],
        },
        {
          id: 'sec-1-3',
          title: 'Practice Dialogue',
          blocks: [
            {
              id: 'blk-11',
              type: 'paragraph',
              content: [
                { text: 'Let\'s see these greetings in action with a simple conversation:' },
              ],
            },
            {
              id: 'blk-12',
              type: 'dialogue',
              title: 'Meeting Someone New',
              context: 'At a coffee shop in Ho Chi Minh City',
              showTranslations: true,
              lines: [
                {
                  speaker: 'Lan',
                  targetText: 'Xin chào! Tôi là Lan.',
                  baseText: 'Hello! I am Lan.',
                },
                {
                  speaker: 'John',
                  targetText: 'Chào Lan! Tôi là John. Rất vui được gặp bạn.',
                  baseText: 'Hi Lan! I am John. Nice to meet you.',
                },
                {
                  speaker: 'Lan',
                  targetText: 'Rất vui được gặp bạn! Bạn có khỏe không?',
                  baseText: 'Nice to meet you! How are you?',
                },
                {
                  speaker: 'John',
                  targetText: 'Tôi khỏe, cảm ơn. Còn bạn?',
                  baseText: 'I\'m fine, thank you. And you?',
                },
              ],
            },
          ],
        },
        {
          id: 'sec-1-4',
          title: 'Exercises',
          blocks: [
            {
              id: 'blk-13',
              type: 'heading',
              level: 3,
              content: 'Practice What You\'ve Learned',
            },
            {
              id: 'blk-14',
              type: 'exercise',
              exerciseType: 'translate',
              instructions: 'Translate the following sentence to Vietnamese:',
              prompt: 'Hello! Nice to meet you.',
              hint: 'Use "Xin chào" for hello',
              showAnswerArea: true,
              linesForAnswer: 2,
            },
            {
              id: 'blk-15',
              type: 'exercise',
              exerciseType: 'fill-blank',
              instructions: 'Fill in the blank:',
              prompt: 'Chào buổi _____! (Good morning)',
              hint: 'What time of day is "morning"?',
              showAnswerArea: true,
              linesForAnswer: 1,
            },
            {
              id: 'blk-16',
              type: 'exercise',
              exerciseType: 'match',
              instructions: 'Match the Vietnamese phrase with its English meaning:',
              pairs: [
                { left: 'Xin chào', right: 'Good night' },
                { left: 'Chúc ngủ ngon', right: 'Hello' },
                { left: 'Tạm biệt', right: 'Goodbye' },
              ],
              showAnswerArea: false,
            },
            {
              id: 'blk-17',
              type: 'exercise',
              exerciseType: 'multiple-choice',
              question: 'Which phrase means "Good evening"?',
              choices: [
                'Chào buổi sáng',
                'Chào buổi chiều',
                'Chào buổi tối',
                'Chúc ngủ ngon',
              ],
              correctIndex: 2,
              showAnswerArea: false,
            },
          ],
        },
      ],
      summary: [
        {
          id: 'sum-1',
          type: 'callout',
          title: 'Chapter Summary',
          variant: 'success',
          content: [
            { text: 'In this chapter, you learned basic Vietnamese greetings, understood the six tones, and practiced a simple conversation.' },
          ],
        },
      ],
    },
    {
      id: 'ch-2',
      number: 2,
      title: 'Tôi là... I am...',
      subtitle: 'Introducing Yourself',
      objectives: [
        'Learn to introduce yourself',
        'Ask and answer basic questions',
        'Use personal pronouns correctly',
      ],
      sections: [
        {
          id: 'sec-2-1',
          title: 'Personal Pronouns',
          blocks: [
            {
              id: 'blk-20',
              type: 'paragraph',
              content: [
                { text: 'Vietnamese pronouns are more complex than English. They change based on age, gender, and social relationship. Don\'t worry—we\'ll start with the basics!' },
              ],
            },
            {
              id: 'blk-21',
              type: 'table',
              caption: 'Basic Vietnamese Pronouns',
              headers: ['Vietnamese', 'English', 'Usage'],
              rows: [
                ['Tôi', 'I/me', 'Neutral, formal'],
                ['Bạn', 'You', 'Friend, peer'],
                ['Anh', 'You (older male)', 'Man older than you'],
                ['Chị', 'You (older female)', 'Woman older than you'],
                ['Em', 'You (younger)', 'Person younger than you'],
              ],
            },
            {
              id: 'blk-22',
              type: 'callout',
              title: 'Pro Tip',
              variant: 'info',
              content: [
                { text: 'When in doubt, use "bạn" (friend) with peers your age. Vietnamese people will gently correct you if needed—it\'s part of learning!' },
              ],
            },
          ],
        },
      ],
    },
  ],

  backMatter: {
    glossary: [
      { term: 'Xin chào', definition: 'Hello (formal greeting)' },
      { term: 'Tạm biệt', definition: 'Goodbye' },
      { term: 'Cảm ơn', definition: 'Thank you' },
      { term: 'Tôi', definition: 'I, me (neutral/formal)' },
      { term: 'Bạn', definition: 'You (friend, peer)' },
    ],
    answerKey: true,
    aboutAuthor: [
      {
        id: 'about-1',
        type: 'paragraph',
        content: [
          { text: 'The EZViet Team is dedicated to making Vietnamese accessible to learners worldwide. Our mission is to bridge cultures through language.' },
        ],
      },
    ],
  },
};

export default SAMPLE_BOOK;

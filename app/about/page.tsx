'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/Header';

export default function AboutPage() {
    const [hoveredValue, setHoveredValue] = useState<number | null>(null);

    const values = [
        {
            title: 'Learning that feels easy and enjoyable',
            icon: '🌱',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            title: 'Clarity over complexity',
            icon: '✨',
            color: 'from-blue-500 to-cyan-600'
        },
        {
            title: 'Honesty over hype',
            icon: '💎',
            color: 'from-purple-500 to-pink-600'
        },
        {
            title: 'Respect for learners and for each other',
            icon: '🤝',
            color: 'from-amber-500 to-orange-600'
        },
        {
            title: 'Long-term collaboration over short-term wins',
            icon: '🌍',
            color: 'from-rose-500 to-red-600'
        }
    ];

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
                    <div className="text-center">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
                            Learn Vietnamese
                            <br />
                            <span className="bg-linear-to-r from-jade-500 via-jade-400 to-jade-600 bg-clip-text text-transparent">
                                the way it should be
                            </span>
                        </h1>

                        <p className="text-xl sm:text-2xl text-(--text-secondary) mb-12 max-w-3xl mx-auto leading-relaxed">
                            We&apos;re building tools that make Vietnamese language learning feel natural, enjoyable, and deeply respectful of both the language and the learner.
                        </p>

                        <Link
                            href="/"
                            className="inline-block px-10 py-5 bg-(--interactive) hover:bg-(--interactive-hover) text-(--text-inverse) text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                            Start Learning Free →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section id="values" className="py-24 bg-(--surface-card)/60 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-6">Our Values</h2>
                        <p className="text-xl text-(--text-secondary) max-w-2xl mx-auto">
                            These principles guide everything we build
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                onMouseEnter={() => setHoveredValue(index)}
                                onMouseLeave={() => setHoveredValue(null)}
                                className={`relative group cursor-default transition-all duration-500 ${hoveredValue === index ? 'scale-105 z-10' : hoveredValue !== null ? 'scale-95 opacity-75' : ''
                                    }`}
                            >
                                <div className="bg-(--surface-card) rounded-2xl p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-(--border-default) hover:border-(--interactive) h-full">
                                    <div className={`text-6xl mb-6 transition-transform duration-300 ${hoveredValue === index ? 'scale-125' : ''
                                        }`}>
                                        {value.icon}
                                    </div>
                                    <h3 className={`text-xl font-bold bg-linear-to-r ${value.color} bg-clip-text text-transparent`}>
                                        {value.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-(--surface-elevated) text-(--text-secondary) py-12 border-t border-(--border-default)">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-base">Built with care for Vietnamese learners everywhere 🇻🇳</p>
                </div>
            </footer>
        </main>
    );
}

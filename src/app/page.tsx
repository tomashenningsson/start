'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout, AuthDialog } from '@/components';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Smartphone } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <MainLayout>
      {user ? (
        // Authenticated home
        <div className="p-6 max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-muted-foreground mt-1">
                Here&apos;s what&apos;s happening with your account.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card">
                <h3 className="font-medium">Quick actions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get started with these common tasks
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" className="rounded-full" asChild>
                    <a href="/profile">Edit profile</a>
                  </Button>
                  <Button variant="secondary" size="sm" className="rounded-full" asChild>
                    <a href="/people">Find people</a>
                  </Button>
                  <Button variant="secondary" size="sm" className="rounded-full" asChild>
                    <a href="/chat">Messages</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Landing page for unauthenticated users
        <div className="flex flex-col">
          {/* Hero */}
          <section className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight max-w-3xl">
              Build apps that work everywhere
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-xl">
              A minimal starter template for creating cross-platform applications
              with React, Next.js, and Capacitor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Button
                onClick={() => setAuthDialogOpen(true)}
                className="h-12 px-8 rounded-full text-base"
              >
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-12 px-8 rounded-full text-base"
                asChild
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
          </section>

          {/* Features */}
          <section className="px-6 py-24 border-t border-border">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-semibold tracking-tight text-center">
                Everything you need
              </h2>
              <p className="text-muted-foreground text-center mt-4 max-w-xl mx-auto">
                Built with modern tools and best practices, so you can focus on
                building your product.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mt-16">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-secondary mb-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Fast by default</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Built on Next.js with optimized performance out of the box.
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-secondary mb-4">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Secure authentication</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supabase Auth with row-level security built in.
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-secondary mb-4">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Cross-platform</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Deploy to web, iOS, and Android from one codebase.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </MainLayout>
  );
}

'use client';

import React from 'react';
import { ModalShowcase } from '@/components/ui/modals/examples/modal-showcase';
import { ModalSystemProvider } from '@/components/ui/modals/modal-provider-setup';

export default function ModalDemoPage() {
  return (
    <ModalSystemProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <ModalShowcase />
        </div>
      </div>
    </ModalSystemProvider>
  );
}
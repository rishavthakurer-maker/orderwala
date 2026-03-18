'use client';

import { useState } from 'react';
import { Header, Footer, BottomNav } from '@/components/layout';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll get back to you soon.');
    setName('');
    setEmail('');
    setMessage('');
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
            { icon: Mail, label: 'Email', value: 'support@orderwala.in', href: 'mailto:support@orderwala.in' },
            { icon: MapPin, label: 'Address', value: 'Patna, Bihar 800001', href: null },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <item.icon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-medium text-gray-900 hover:text-orange-600">{item.value}</a>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <textarea
                placeholder="Your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <Button type="submit" className="w-full" disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

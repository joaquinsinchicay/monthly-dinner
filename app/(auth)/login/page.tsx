import { AuthShell } from '@/components/layout/auth-shell';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import Link from 'next/link';
import type { Route } from 'next';

function CutleryIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"
        fill="#2563EB"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const infoMessage =
    params?.message === 'cancelled'
      ? 'You cancelled Google authorization. You can try again whenever you want.'
      : null;
  const errorMessage =
    params?.error === 'oauth_failed'
      ? 'There was a problem connecting to Google. Please try again.'
      : null;

  return (
    <AuthShell>
      <div
        className="rounded-xl p-10 shadow-md"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="flex flex-col items-center text-center">
          <h1
            className="text-2xl font-extrabold"
            style={{ color: '#000000', fontFamily: 'Inter, sans-serif' }}
          >
            monthly-dinner
          </h1>
          <p className="mt-2 text-base" style={{ color: '#6B7280' }}>
            Coordinate your monthly dinners, effortlessly
          </p>

          <div
            className="mt-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <CutleryIcon />
          </div>

          <div className="mt-8 w-full">
            {infoMessage ? (
              <p className="mb-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
                {infoMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}

            <GoogleSignInButton nextPath={params?.next} />
          </div>

          <p className="mt-6 text-sm" style={{ color: '#6B7280' }}>
            New here?{' '}
            <Link
              href={"/about" as Route}
              className="underline"
              style={{ color: '#1A1A1A' }}
            >
              Learn about our curation
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

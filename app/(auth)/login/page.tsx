'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;600&display=swap');
      `}</style>

      <main
        className="flex min-h-screen flex-col px-6 py-8"
        style={{ backgroundColor: '#fcf9f8' }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-1 flex-col items-center justify-between text-center">
          <section className="flex w-full flex-1 flex-col justify-center">
            <div className="flex flex-col items-center">
              <h1
                className="text-[32px] leading-none"
                style={{
                  color: '#1c1b1b',
                  fontFamily: '"DM Serif Display", serif',
                  letterSpacing: '-0.02em',
                }}
              >
                monthly-dinner
              </h1>
              <p
                className="mt-6 text-[14px] leading-5"
                style={{
                  color: '#585f6c',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 400,
                }}
              >
                La cena del primer jueves de cada mes.
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center py-14">
              <span
                aria-hidden="true"
                className="text-[64px] leading-none"
                style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}
              >
                🍽️
              </span>
            </div>

            <div className="w-full">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-full px-6 py-[15px] uppercase tracking-[0.04em] text-white transition disabled:pointer-events-none"
                style={{
                  background: 'linear-gradient(45deg, #004ac6, #2563eb)',
                  boxShadow: '0 4px 16px rgba(0,74,198,0.25)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {isLoading ? (
                  <span
                    aria-hidden="true"
                    className="mr-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <span className="mr-3 inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21.805 12.23c0-.68-.061-1.334-.174-1.962H12v3.71h5.498a4.703 4.703 0 0 1-2.04 3.086v2.563h3.304c1.934-1.78 3.043-4.403 3.043-7.397Z"
                        fill="white"
                      />
                      <path
                        d="M12 22c2.76 0 5.074-.914 6.765-2.473l-3.304-2.563c-.914.612-2.083.974-3.46.974-2.655 0-4.904-1.793-5.708-4.205H2.876v2.644A9.998 9.998 0 0 0 12 22Z"
                        fill="white"
                        fillOpacity="0.88"
                      />
                      <path
                        d="M6.292 13.733A5.996 5.996 0 0 1 5.973 12c0-.602.109-1.186.319-1.733V7.623H2.876A10 10 0 0 0 2 12c0 1.613.385 3.141 1.068 4.377l3.224-2.644Z"
                        fill="white"
                        fillOpacity="0.72"
                      />
                      <path
                        d="M12 6.062c1.501 0 2.85.517 3.912 1.531l2.934-2.934C17.07 3.01 14.757 2 12 2A9.998 9.998 0 0 0 2.876 7.623l3.416 2.644c.804-2.412 3.053-4.205 5.708-4.205Z"
                        fill="white"
                        fillOpacity="0.56"
                      />
                    </svg>
                  </span>
                )}
                <span>{isLoading ? 'Conectando...' : 'Ingresar con Google'}</span>
              </button>

              <p
                className="mt-4 text-[11px] leading-4"
                style={{
                  color: '#c3c6d7',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 400,
                }}
              >
                Solo usamos tu cuenta de Google. Sin contrasenas.
              </p>
            </div>
          </section>

          <footer
            className="w-full pt-8 text-center text-[11px] leading-4"
            style={{
              color: '#c3c6d7',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
            }}
          >
            Cenas del Jueves · Buenos Aires
          </footer>
        </div>
      </main>
    </>
  );
}

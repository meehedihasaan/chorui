import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { NextImage } from '@components/ui/next-image';
import { CustomIcon } from '@components/ui/custom-icon';
import { Button } from '@components/ui/button';

export function LoginMain(): JSX.Element {
  const {
    signInWithGoogle,
    signInWithLovable,
    signInWithEmail,
    signUpWithEmail,
    error
  } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error('Enter your email and password.');
      return;
    }

    if (isSignUp) await signUpWithEmail(email, password);
    else await signInWithEmail(email, password);
  };

  const googleButtonClass =
    'flex justify-center gap-2 border border-light-line-reply font-bold text-light-primary transition ' +
    'hover:bg-[#e6e6e6] focus-visible:bg-[#e6e6e6] active:bg-[#cccccc] dark:border-0 dark:bg-white ' +
    'dark:hover:brightness-90 dark:focus-visible:brightness-90 dark:active:brightness-75';

  return (
    <main className='grid lg:grid-cols-[1fr_45vw]'>
      <div className='relative hidden items-center justify-center lg:flex'>
        <NextImage
          imgClassName='object-cover'
          blurClassName='bg-accent-blue'
          src='/assets/twitter-banner.png'
          alt='Chorui banner'
          useSkeleton
          className='absolute inset-0 h-full w-full'
        />
        <i className='absolute'>
          <CustomIcon className='h-96 w-96 text-white' iconName='TwitterIcon' />
        </i>
      </div>
      <div className='flex flex-col items-center justify-between gap-6 p-8 lg:items-start lg:justify-center'>
        <i className='mb-0 self-center lg:mb-10 lg:self-auto'>
          <CustomIcon
            className='-mt-4 h-6 w-6 text-accent-blue lg:h-12 lg:w-12 dark:lg:text-twitter-icon'
            iconName='TwitterIcon'
          />
        </i>
        <div className='flex max-w-xs flex-col gap-4 font-twitter-chirp-extended lg:max-w-none lg:gap-16'>
          <h1
            className='text-3xl before:content-["See_what’s_happening_in_the_world_right_now."]
                       lg:text-6xl lg:before:content-["Happening_now"]'
          />
          <h2 className='hidden text-xl lg:block lg:text-3xl'>
            Join Chorui today.
          </h2>
        </div>
        <div className='flex max-w-xs flex-col gap-6 [&_button]:py-2'>
          <div className='grid gap-3 font-bold'>
            <Button className={googleButtonClass} onClick={signInWithGoogle}>
              <CustomIcon iconName='GoogleIcon' /> Sign up with Google
            </Button>
            <Button className={googleButtonClass} onClick={signInWithLovable}>
              <CustomIcon iconName='TwitterIcon' className='h-5 w-5 text-accent-blue' />
              Continue with Lovable
            </Button>
            <div className='grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2'>
              <i className='border-b border-light-border dark:border-dark-border' />
              <p>or</p>
              <i className='border-b border-light-border dark:border-dark-border' />
            </div>
            <Button
              className='bg-accent-blue text-white transition hover:brightness-90
                         focus-visible:ring-accent-blue/80! focus-visible:brightness-90 active:brightness-75'
              onClick={() => setShowEmailForm(!showEmailForm)}
            >
              {showEmailForm ? 'Hide email sign-up' : 'Sign up with email'}
            </Button>

            {showEmailForm && (
              <form className='grid gap-2' onSubmit={handleEmailSubmit}>
                <input
                  type='email'
                  required
                  placeholder='Email'
                  value={email}
                  onChange={({ target: { value } }) => setEmail(value)}
                  className='rounded-md border border-light-line-reply bg-main-background px-4 py-3 text-sm
                             outline-none focus:ring-2 focus:ring-main-accent dark:border-light-border'
                />
                <input
                  type='password'
                  required
                  minLength={6}
                  placeholder='Password'
                  value={password}
                  onChange={({ target: { value } }) => setPassword(value)}
                  className='rounded-md border border-light-line-reply bg-main-background px-4 py-3 text-sm
                             outline-none focus:ring-2 focus:ring-main-accent dark:border-light-border'
                />
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    type='submit'
                    className='bg-accent-blue text-white transition hover:brightness-90
                               focus-visible:ring-accent-blue/80! focus-visible:brightness-90 active:brightness-75'
                  >
                    {isSignUp ? 'Create account' : 'Sign in'}
                  </Button>
                  <Button
                    type='button'
                    className='border border-light-line-reply font-bold text-accent-blue hover:bg-accent-blue/10
                               dark:border-light-secondary'
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'I have an account' : 'Create one'}
                  </Button>
                </div>
              </form>
            )}

            <p
              className='inner:custom-underline inner:custom-underline text-center text-xs
                         text-light-secondary inner:text-accent-blue dark:text-dark-secondary'
            >
              By signing up, you agree to the{' '}
              <a href='https://twitter.com/tos' target='_blank' rel='noreferrer'>
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href='https://twitter.com/privacy'
                target='_blank'
                rel='noreferrer'
              >
                Privacy Policy
              </a>
              , including{' '}
              <a
                href='https://help.twitter.com/rules-and-policies/twitter-cookies'
                target='_blank'
                rel='noreferrer'
              >
                Cookie Use
              </a>
              .
            </p>
          </div>
          <div className='flex flex-col gap-3'>
            <p className='font-bold'>Already have an account? </p>
            <Button
              className='border border-light-line-reply font-bold text-accent-blue hover:bg-accent-blue/10
                         focus-visible:bg-accent-blue/10 focus-visible:ring-accent-blue/80! active:bg-accent-blue/20
                         dark:border-light-secondary'
              onClick={signInWithGoogle}
            >
              Sign in
            </Button>
          </div>
          {error && (
            <p className='text-sm text-accent-red' role='alert'>
              {error.message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

const items = [
  {
    title: 'Phone sign-in (SMS)',
    status: 'Needs setup',
    steps: 'Open More → Users → Auth settings → Phone settings, turn it on and add a text-message service such as Twilio.'
  },
  {
    title: 'Email sending (SMTP)',
    status: 'Default sender',
    steps: 'Sign-in emails already send. To send from your own address, open More → Emails and verify a domain you own.'
  }
];

export function AuthSetup(): JSX.Element {
  return (
    <section className='mt-6 flex flex-col gap-3 px-4 pb-6'>
      <h2 className='text-lg font-bold'>Sign-in &amp; email setup</h2>
      <p className='text-sm text-light-secondary dark:text-dark-secondary'>
        These are managed in the Lovable editor for security. The app itself cannot change them.
      </p>
      {items.map(({ title, status, steps }) => (
        <div key={title} className='rounded-2xl border border-light-border p-3 dark:border-dark-border'>
          <div className='flex items-center justify-between'>
            <span className='font-bold'>{title}</span>
            <span className='rounded-full border border-light-border px-2 text-xs dark:border-dark-border'>{status}</span>
          </div>
          <p className='mt-1 text-sm text-light-secondary dark:text-dark-secondary'>{steps}</p>
        </div>
      ))}
    </section>
  );
}

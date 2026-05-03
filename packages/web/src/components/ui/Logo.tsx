import { Link } from 'react-router';

type Props = {
  isLandingPage?: boolean;
};

export const Logo = (props: Props) => {
  const { isLandingPage } = props;

  const logoImage = (
    <img src="/genkai-logo.svg" alt="ロゴ" className="h-8 w-auto lg:h-10" />
  );

  return (
    <div className='flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-4'>
      {isLandingPage ? (
        <h1 className='flex items-center'>
          {logoImage}
        </h1>
      ) : (
        <Link
          to='/'
          className='flex items-center focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2'
        >
          {logoImage}
        </Link>
      )}
    </div>
  );
};

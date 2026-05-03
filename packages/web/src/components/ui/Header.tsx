import {
  HamburgerMenuButton,
  HamburgerWithLabelIcon,
} from '@/components/ui/dads/HamburgerMenuButton';
import { Logo } from '@/components/ui/Logo';

type Props = {
  className?: string;
  isLandingPage?: boolean;
  onClickMenuToggleForMobile: () => void;
};

export const Header = (props: Props) => {
  const { className, isLandingPage, onClickMenuToggleForMobile } = props;

  return (
    <header
      className={`flex h-(--header-height) items-center justify-start border-b border-b-gray-400 bg-white pl-1.5 lg:pl-4 ${className ?? ''}`}
    >
      {/* For Mobile view */}
      <HamburgerMenuButton
        className={`relative z-10 mr-1.5 lg:hidden`}
        aria-controls='main-menu-container'
        aria-haspopup='dialog'
        onClick={onClickMenuToggleForMobile}
      >
        <HamburgerWithLabelIcon className='flex-none' />
      </HamburgerMenuButton>
      <Logo isLandingPage={isLandingPage} />

      <div className='ml-auto flex h-full'>
        {/* AccountMenu was removed based on requirements */}
      </div>
    </header>
  );
};

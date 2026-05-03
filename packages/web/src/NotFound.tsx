import { Link } from 'react-router';
import { Link as DadsLink } from '@/components/ui/dads/Link';
import { APP_TITLE } from './constants';

export const NotFound = () => {
  return (
    <div className='mx-6 max-w-[calc(1024/16*1rem)] pb-6 lg:mx-8 lg:pb-8'>
      <h1 className='mt-4 text-3xl font-bold leading-snug lg:mt-6 lg:text-6xl font-bold leading-snug'>
        404 Not Found
      </h1>
      <h2 className='mt-8 mb-6 text-2xl font-bold leading-snug lg:mt-12 lg:text-4xl font-bold leading-snug'>
        指定されたページまたはファイルは存在しません
      </h2>
      <p>
        アクセスしていただいたページは、削除もしくは移動した可能性があります。
        <br />
        大変お手数ですが、アドレス（URL）をご確認の上再度お探しいただくか、
        <DadsLink asChild>
          <Link to='/'>{APP_TITLE ? `${APP_TITLE} トップページ` : 'トップページ'}</Link>
        </DadsLink>
        からご利用ください。
      </p>
    </div>
  );
};

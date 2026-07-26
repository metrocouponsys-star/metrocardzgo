import MemberDetailClientWrapper from './ClientWrapper';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function MemberDetailRoutePage() {
  return <MemberDetailClientWrapper />;
}

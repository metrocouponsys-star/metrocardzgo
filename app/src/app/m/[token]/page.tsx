import ClientWrapper from './ClientWrapper';

export function generateStaticParams() {
  return [{ token: 'demo' }];
}

export default function PublicMemberPageRoute() {
  return <ClientWrapper />;
}

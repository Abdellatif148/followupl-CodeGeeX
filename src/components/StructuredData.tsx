import { Helmet } from 'react-helmet-async';

export const StructuredData = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FollowUply',
    url: 'https://fcodegeex.vercel.app',
    logo: 'https://fcodegeex.vercel.app/followuplyImage.png',
    sameAs: [
      'https://twitter.com/followuply',
      'https://facebook.com/followuply',
      'https://linkedin.com/company/followuply'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-123-456-7890',
      contactType: 'customer service'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FollowUply',
    url: 'https://fcodegeex.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://fcodegeex.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FollowUply',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'Client follow-up management solution for businesses that helps track reminders, invoices, and client communications in one place.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
};

import React from 'react';

const StructuredData = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Followuply",
    "url": "https://followuply.vercel.app",
    "logo": "https://followuply.vercel.app/assets/logo.png",
    "sameAs": [
      "https://twitter.com/followuply",
      "https://linkedin.com/company/followuply"
    ],
    "@type": "WebSite",
    "url": "https://followuply.vercel.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://followuply.vercel.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "@type": "Product",
    "name": "Followuply SaaS Platform",
    "description": "The ultimate SaaS platform for managing follow-ups efficiently.",
    "brand": {
      "@type": "Brand",
      "name": "Followuply"
    }
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  );
};

export default StructuredData;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation }
from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { Receipt } from '@/types/receipt';
import { Clock, Flame, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { iconUrlMap } from '@/utils/iconMapping'; // Import the iconUrlMap

// Helper function to capitalize the first letter of each word
const capitalizeWords = (str: string | null) => {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ReceiptPage = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();

  const [receiptData, setReceiptData] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSmoothieRecipe, setIsSmoothieRecipe] = useState<boolean>(false); // New state variable

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!slug) {
        setError("No receipt slug provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setReceiptData(null);
      setIsSmoothieRecipe(false); // Reset smoothie status on new fetch

      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*, nutritional_info(*), 2bitesco_product')
          .eq('slug', slug)
          .eq('language', i18n.language)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          const parsedData: Receipt = { ...data as Receipt };

          if (typeof data['2bitesco_product'] === 'string' && data['2bitesco_product'].includes('_')) {
            const [type, variant] = data['2bitesco_product'].split('_');
            parsedData.bitesco_product_type = type;
            parsedData.bitesco_product_variant = variant;
          } else {
            parsedData.bitesco_product_type = null;
            parsedData.bitesco_product_variant = null;
          }

          setReceiptData(parsedData);
          // Determine if it's a smoothie recipe
          setIsSmoothieRecipe(parsedData.bitesco_product_type === 'smoothie');
        } else {
          setError("Receipt not found.");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError(`Failed to load receipt: ${(err as Error).message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [slug, i18n.language]);

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Conditional navigation based on isSmoothieRecipe
    if (isSmoothieRecipe) {
      navigate(`/${currentLang}/productos/smoothies-instantaneos`);
    } else {
      navigate(`/${currentLang}/#products`);
    }
  };

  return (
    <main className="relative bg-background text-foreground min-h-screen flex flex-col">
      {receiptData && (
        <Helmet>
          <title>{receiptData.seo_title || receiptData.title || '2Bites Smoothies'}</title>
          <meta
            name="description"
            content={receiptData.seo_description || 'Discover delicious and healthy smoothie recipes from 2Bites.'}
          />
          {receiptData.seo_keywords && (
            <meta name="keywords" content={receiptData.seo_keywords} />
          )}
        </Helmet>
      )}

      <Header />

      {/* Back to Products Menu Bar */}
      <div className="w-full bg-white border-b border-border/10 shadow-md z-[50] sticky top-[7.5rem] md:top-[8.5rem]">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <Link
            to={isSmoothieRecipe ? `/${currentLang}/productos/smoothies-instantaneos` : `/${currentLang}/#products`}
            onClick={handleBackClick}
            className="inline-flex items-center text-green-700 hover:underline text-sm gap-1 group transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {isSmoothieRecipe ? t('receiptPage.viewInstantSmoothies') : t('receiptPage.backToProducts')}
          </Link>
        </div>
      </div>

      {/* Main content area - Adjusted padding-top */}
      <div className="flex-grow flex flex-col items-center justify-start pt-[10.75rem] md:pt-[11.75rem] pb-16">
        {loading && <p className="text-xl text-primary animate-fade-in">Loading receipt...</p>}
        {error && <p className="text-xl text-destructive animate-fade-in">{error}</p>}

        {!loading && !error && !receiptData && slug && (
          <p className="text-xl text-muted-foreground text-center animate-fade-in">
            No receipt found for slug: <span className="font-semibold text-primary">{slug}</span> in language: <span className="font-semibold text-primary">{i18n.language}</span>.
          </p>
        )}

        {receiptData && (
          <div className="w-full">
            {/* Hero Section - Now the main two-column layout */}
            <section className="w-full bg-gradient-to-br from-primary/10 to-background py-16 md:py-24">
              <div className="container mx-auto px-4 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Image Column - order-1 on mobile, md:order-none for desktop grid flow */}
                {receiptData.image_url && (
                  <div className="relative w-full rounded-xl overflow-hidden shadow-2xl transform translate-y-0 opacity-100 transition-all duration-700 ease-out animate-fade-in-up-delay aspect-[4/5] mx-auto md:mx-0 order-1 md:order-none">
                    <img
                      src={receiptData.image_url}
                      alt={receiptData.image_alt_text || receiptData.title || 'Receipt image'}
                      className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white flex justify-center items-center space-x-6 text-lg md:text-xl font-semibold">
                      {receiptData.prep_time && (
                        <span className="flex items-center gap-2">
                          <Clock className="h-5 w-5" /> {receiptData.prep_time}
                        </span>
                      )}
                      {receiptData.calories && (
                        <span className="flex items-center gap-2">
                          <Flame className="h-5 w-5" /> {receiptData.calories}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Text Content Column: Title, Perfecto para, Tags, Nutritional Info - order-2 on mobile, md:order-none for desktop grid flow */}
                <div className="text-center md:text-left order-2 md:order-none">
                  {/* Conditionally render product type and variant */}
                  {receiptData.bitesco_product_type && receiptData.bitesco_product_variant && (
                    <h2 className="text-lg md:text-xl font-semibold text-secondary mb-2 animate-fade-in-up-delay">
                      {t('receiptPage.recipeFor')}{' '}
                      {capitalizeWords(receiptData.bitesco_product_variant)}{' '}
                      {capitalizeWords(receiptData.bitesco_product_type)}
                    </h2>
                  )}

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-primary leading-tight mb-8 animate-fade-in-up">
                    {receiptData.title}
                  </h1>

                  {/* Perfecto para Section (no card) */}
                  {receiptData.perfect_for && (
                    <div className="text-lg text-foreground/80 leading-relaxed mb-6 animate-fade-in-up-delay">
                      <p className="italic">{receiptData.perfect_for}</p>
                    </div>
                  )}

                  {/* Tags Section (no card) */}
                  {receiptData.tags && receiptData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6 justify-center animate-fade-in-up-delay-2">
                      {receiptData.tags.map((tag, index) => (
                        <div key={index} className={cn( // Changed from span to div, added flex-col for vertical layout
                          `flex flex-col items-center justify-center p-2 text-center rounded-lg shadow-sm`,
                          tag.iconColorClass || 'bg-slate-100 dark:bg-slate-800' // Apply iconColorClass to container background
                        )}>
                          {tag.iconIdentifier && iconUrlMap[tag.iconIdentifier] && (
                            <img
                              src={iconUrlMap[tag.iconIdentifier]}
                              alt={`${tag.text} icon`}
                              className="w-16 h-16 mb-4 flex-shrink-0" // Updated image classes
                            />
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight"> {/* New text styling */}
                            {t(`receiptPage.tags.${tag.text}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nutritional Information Section - NEW PLACEMENT */}
                  {receiptData.nutritional_info && (
                    <div className="mt-4 p-4 animate-fade-in-up-delay-3">
                      <div>
                        <div className="text-xl font-semibold text-primary mb-3">
                          {t('receiptPage.sections.nutritionalInfo.title')}
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5 border-b border-border/50">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.calories')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.calories_kcal || 'N/A'} kcal</div>
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5 border-b border-border/50">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.protein')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.protein_g || 'N/A'} g</div>
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5 border-b border-border/50">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.carbohydrates')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.carbohydrates_g || 'N/A'} g</div>
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5 border-b border-border/50">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.fats')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.fats_g || 'N/A'} g</div>
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5 border-b border-border/50">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.fiber')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.fiber_g || 'N/A'} g</div>
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5 border-b border-border/50">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.sugars')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.sugars_g || 'N/A'} g</div>
                        </div>
                        <div className="grid grid-cols-[max-content_1fr] gap-2 items-center py-1.5">
                          <div className="font-medium text-foreground/80 text-sm">{t('receiptPage.sections.nutritionalInfo.sodium')}</div>
                          <div className="text-foreground/70 text-right text-sm">{receiptData.nutritional_info.sodium_mg || 'N/A'} mg</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Remaining sections (Ingredients, Benefits, How to Prepare, Quote) */}
            <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl space-y-12 md:space-y-16">
              {/* Ingredients Section */}
              {receiptData.ingredients && receiptData.ingredients.length > 0 && (
                <Card className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="text-secondary">{t('receiptPage.sections.ingredients.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {receiptData.ingredients.map((item: string, index: number) => (
                        <li key={index} className="flex items-start text-base leading-normal">
                          <span className="mr-2 text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Benefits Section */}
              {receiptData.benefits && receiptData.benefits.length > 0 && (
                <Card className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="text-secondary">{t('receiptPage.sections.benefits.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {receiptData.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start text-base leading-normal">
                          <span className="mr-2 text-primary">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* How to Prepare Section */}
              {receiptData.how_to_prepare && (
                <Card className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="text-secondary">{t('receiptPage.sections.howToPrepare.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-normal whitespace-pre-wrap">{receiptData.how_to_prepare}</p>
                  </CardContent>
                </Card>
              )}

              {/* Quote Section (distinct styling, not a Card component) */}
              {receiptData.quote && (
                <section className="bg-muted p-8 rounded-xl shadow-inner text-muted-foreground animate-fade-in-up">
                  <blockquote className="text-xl md:text-2xl italic text-center leading-relaxed">
                    <span className="text-primary text-4xl font-serif mr-2">“</span>
                    {receiptData.quote}
                    <span className="text-primary text-4xl font-serif ml-2">”</span>
                  </blockquote>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
};

export default ReceiptPage;

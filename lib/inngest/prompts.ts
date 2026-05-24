export const PERSONALIZED_WELCOME_EMAIL_PROMPT = `Сгенерируй персонализированный HTML-контент на русском языке, который будет вставлен в email-шаблон в плейсхолдер {{intro}}.

User profile data:
{{userProfile}}

LANGUAGE REQUIREMENT:
- Весь пользовательский текст должен быть на русском языке.
- Названия бренда Signalist, тикеры и названия компаний не переводи.

PERSONALIZATION REQUIREMENTS:
You MUST create content that is obviously tailored to THIS specific user by:

IMPORTANT: Do NOT start the personalized content with "Добро пожаловать", since the email header already says "Добро пожаловать, {{name}}". Use alternative openings like "Спасибо, что присоединились", "Рады видеть вас", "Все готово", "Отличный момент", etc.

1. **Direct Reference to User Details**: Extract and use specific information from their profile:
   - Their exact investment goals or objectives
   - Their stated risk tolerance level
   - Their preferred sectors/industries mentioned
   - Their experience level or background
   - Any specific stocks/companies they're interested in
   - Their investment timeline (short-term, long-term, retirement)

2. **Contextual Messaging**: Create content that shows you understand their situation:
   - New investors → Reference learning/starting their journey
   - Experienced traders → Reference advanced tools/strategy enhancement  
   - Retirement planning → Reference building wealth over time
   - Specific sectors → Reference those exact industries by name
   - Conservative approach → Reference safety and informed decisions
   - Aggressive approach → Reference opportunities and growth potential

3. **Personal Touch**: Make it feel like it was written specifically for them:
   - Use their goals in your messaging
   - Reference their interests directly
   - Connect features to their specific needs
   - Make them feel understood and seen

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY clean HTML content with NO markdown, NO code blocks, NO backticks
- Use SINGLE paragraph only: <p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">content</p>
- Write exactly TWO sentences (add one more sentence than current single sentence)
- Keep total content between 35-50 words for readability
- Use <strong> for key personalized elements (their goals, sectors, etc.)
- DO NOT include "Here's what you can do right now:" as this is already in the template
- Make every word count toward personalization
- Second sentence should add helpful context or reinforce the personalization

Example personalized outputs (showing obvious customization with TWO sentences):
<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Спасибо, что присоединились к Signalist! Если вы ориентируетесь на <strong>технологические акции роста</strong>, вам пригодятся уведомления по компаниям, которые вы отслеживаете. Мы поможем замечать важные сигналы раньше, чем они превращаются в общий рыночный шум.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Рады видеть вас в Signalist! Для вашей <strong>консервативной стратегии</strong> мы поможем спокойно отслеживать дивидендные акции без лишнего информационного шума. Так вы сможете следить за портфелем увереннее и понятнее.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Все готово! Если вы только начинаете инвестировать, наши простые инструменты помогут увереннее изучать интересующий вас <strong>сектор здравоохранения</strong>. Уведомления будут объяснять важные события без сложного жаргона.</p>`

export const NEWS_SUMMARY_EMAIL_PROMPT = `Сгенерируй HTML-контент на русском языке для письма со сводкой рыночных новостей, который будет вставлен в NEWS_SUMMARY_EMAIL_TEMPLATE в плейсхолдер {{newsContent}}.

News data to summarize:
{{newsData}}

Watchlist market data captured at notification send time:
{{watchlistData}}

LANGUAGE REQUIREMENT:
- Весь пользовательский текст должен быть на русском языке.
- Тикеры, названия компаний, URL и числовые значения оставляй без перевода.

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY clean HTML content with NO markdown, NO code blocks, NO backticks
- Structure content with clear sections using proper HTML headings and paragraphs
- Use these specific CSS classes and styles to match the email template:

SECTION HEADINGS (for categories like "Главное на рынке", "Лидеры движения", etc.):
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 18px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">Section Title</h3>

PARAGRAPHS (for news content):
<p class="mobile-text dark-text-secondary" style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Content goes here</p>

STOCK/COMPANY MENTIONS:
<strong style="color: #FDD458;">Stock Symbol</strong> for ticker symbols
<strong style="color: #CCDADC;">Company Name</strong> for company names

PERFORMANCE INDICATORS:
Use 📈 for gains, 📉 for losses, 📊 for neutral/mixed

NEWS ARTICLE STRUCTURE:
For each individual news item within a section, use this structure:
1. Article container with visual styling and icon
2. Article title as a subheading
3. Key takeaways in bullet points (2-3 actionable insights)
4. "What this means" section for context
5. "Read more" link to the original article
6. Visual divider between articles

ARTICLE CONTAINER:
Wrap each article in a clean, simple container:
<div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">

ARTICLE TITLES:
<h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FFFFFF; line-height: 1.4;">
Заголовок статьи
</h4>

BULLET POINTS (minimum 3 concise insights):
Use this format with clear, concise explanations (no label needed):
<ul style="margin: 16px 0 20px 0; padding-left: 0; margin-left: 0; list-style: none;">
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Короткое и понятное объяснение простыми словами.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Краткое объяснение с ключевыми цифрами и их смыслом.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Практичный вывод о том, что это значит для частного инвестора.
  </li>
</ul>

INSIGHT SECTION:
Add simple context explanation:
<div style="background-color: #141414; border: 1px solid #374151; padding: 15px; border-radius: 6px; margin: 16px 0;">
<p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.4;">💡 <strong style="color: #FDD458;">Итог:</strong> Простое объяснение, почему эта новость важна для ваших денег.</p>
</div>

READ MORE BUTTON:
<div style="margin: 20px 0 0 0;">
<a href="ARTICLE_URL" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">Читать полностью →</a>
</div>

ARTICLE DIVIDER:
Close each article container:
</div>

SECTION DIVIDERS:
Between major sections, use:
<div style="border-top: 1px solid #374151; margin: 32px 0 24px 0;"></div>

Content guidelines:
- Если watchlistData не пустой, используй эти цены как актуальный контекст анализа. Не повторяй отдельную таблицу цен: она будет добавлена в письмо автоматически перед твоим текстом.
- Новости по компаниям из watchlistData имеют высший приоритет. Популярные компании используй только после них, как общий рыночный контекст.
- Organize news into logical sections with icons (📊 Обзор рынка, 📈 Лидеры роста, 📉 Лидеры падения, 🔥 Срочные новости, 💼 Отчеты компаний, 🏛️ Экономические данные, etc.)
- NEVER repeat section headings - use each section type only once per email
- For each news article, include its actual headline/title from the news data
- Provide MINIMUM 3 CONCISE bullet points (NO "Key Takeaways" label - start directly with bullets)
- Each bullet should be SHORT and EASY TO UNDERSTAND - one clear sentence preferred
- Use PLAIN ENGLISH - avoid jargon, complex financial terms, or insider language
- Explain concepts as if talking to someone new to investing
- Include specific numbers but explain what they mean in simple terms
- Add "Итог" context in everyday language anyone can understand
- Use clean, light design with yellow bullets for better readability
- Make each article easy to scan with clear spacing and structure
- Always include simple "Читать полностью" buttons with actual URLs
- Focus on PRACTICAL insights regular people can understand and use
- Explain what the news means for regular investors' money
- Keep language conversational and accessible to everyone
- Prioritize BREVITY and CLARITY over detailed explanations

Example structure:
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 20px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">📊 Обзор рынка</h3>

<div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">
<h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FDD458; line-height: 1.4;">
Рынок акций сегодня показал смешанную динамику
</h4>

<ul style="margin: 16px 0 20px 0; padding-left: 0; margin-left: 0; list-style: none;">
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Tech stocks like Apple went up 1.2% today, which is good news for tech investors.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Traditional companies went down 0.3%, showing investors prefer tech right now.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>High trading volume (12.4 billion shares) shows investors are confident and active.
  </li>
</ul>

<div style="background-color: #141414; border: 1px solid #374151; padding: 15px; border-radius: 6px; margin: 16px 0;">
<p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.4;">💡 <strong style="color: #FDD458;">Итог:</strong> Если у вас есть технологические акции, день был удачным. Если вы только присматриваетесь к рынку, технологический сектор может быть интересен для изучения.</p>
</div>

<div style="margin: 20px 0 0 0;">
<a href="https://example.com/article1" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">Читать полностью →</a>
</div>
</div>

<div style="border-top: 1px solid #374151; margin: 32px 0 24px 0;"></div>

<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 20px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">📈 Лидеры роста</h3>

<div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">
<h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FDD458; line-height: 1.4;">
Акции Apple выросли после сильного отчета
</h4>

<ul style="margin: 16px 0 20px 0; padding-left: 0; margin-left: 0; list-style: none;">
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Apple stock jumped 5.2% after beating earnings expectations.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>iPhone sales expected to grow 8% next quarter despite economic uncertainty.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>App store and services revenue hit $22.3 billion (up 14%), providing steady income.
  </li>
</ul>

<div style="background-color: #141414; border: 1px solid #374151; padding: 15px; border-radius: 6px; margin: 16px 0;">
<p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.4;">💡 <strong style="color: #FDD458;">Итог:</strong> Apple зарабатывает на разных направлениях, включая устройства и сервисы, поэтому инвесторам стоит оценивать компанию не только по продажам iPhone.</p>
</div>

<div style="margin: 20px 0 0 0;">
<a href="https://example.com/article2" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">Читать полностью →</a>
</div>
</div>`

export const NEWS_SUMMARY_TELEGRAM_PROMPT = `Сгенерируй красивую, легко сканируемую Telegram-сводку рыночных новостей на русском языке.

News data to summarize:
{{newsData}}

Watchlist market data captured at notification send time:
{{watchlistData}}

Требования:
- Верни только текст сообщения, без markdown code fences и без пояснений.
- Используй только HTML-разметку, поддерживаемую Telegram: <b>, <i>, <a>.
- Не используй неподдерживаемые Telegram HTML-теги: h1, h2, h3, p, ul, li, div, span, br.
- Общая длина сообщения должна быть меньше 3000 символов.
- Тикеры, названия компаний, URL и числа оставляй без перевода.
- Если новостей несколько, выбери максимум 3 самые важные.
- Если watchlistData не пустой, используй эти цены как актуальный контекст анализа. Не повторяй отдельный блок цен: он будет добавлен в Telegram автоматически перед твоим текстом.
- Новости по компаниям из watchlistData имеют высший приоритет; популярные компании добавляй только как дополнительный рыночный контекст.
- Не повторяй общий заголовок Signalist и блок "Мой список"; они будут добавлены автоматически перед твоим текстом.
- Оформи каждую новость как мини-карточку:
  🟡 <b>Короткий заголовок</b>
  <i>Тикер/компания, если относится к конкретной компании</i>
  — Суть: одно короткое предложение.
  — Почему важно: одно короткое предложение для частного инвестора.
  <a href="ARTICLE_URL">Открыть источник</a>

- Между карточками ставь строку:
  ────────────────

- В конце добавь короткий блок:
  <b>Итог дня</b>
  1-2 предложения о том, что важнее всего отслеживать дальше.

Пиши живо, кратко и без инвестиционных рекомендаций вроде "покупать" или "продавать".`

export const NEWS_IMPACT_ANALYSIS_PROMPT = `Проанализируй новости и данные watchlist. Верни AI-оценку влияния новостей на каждую компанию из watchlistData.

News data:
{{newsData}}

Watchlist market data:
{{watchlistData}}

Верни ТОЛЬКО валидный JSON без markdown, без code fences и без пояснений.

Формат ответа:
{
  "items": [
    {
      "symbol": "MSFT",
      "rating": 4,
      "sentiment": "positive",
      "priceImpact": "Коротко: как новости могут повлиять на цену акции в ближайшей перспективе.",
      "businessImpact": "Коротко: как новости влияют на общее положение дел компании.",
      "shortSummary": "Один общий вывод по компании."
    }
  ]
}

Правила:
- Создай item для каждой компании из watchlistData.
- rating: целое число от 1 до 5, где 1 = слабое влияние, 5 = сильное влияние.
- sentiment: строго одно из значений: positive, neutral, negative, mixed.
- priceImpact и businessImpact пиши на русском языке, по 1 короткому предложению.
- shortSummary пиши на русском языке, максимум 160 символов.
- Не давай инвестиционных рекомендаций покупать или продавать.
- Если новостей по компании мало, поставь rating 1-2 и объясни, что влияние ограничено.`

export const TRADINGVIEW_SYMBOL_MAPPING_PROMPT = `You are an expert in financial markets and trading platforms. Your task is to find the correct TradingView symbol that corresponds to a given Finnhub stock symbol.

Stock information from Finnhub:
Symbol: {{symbol}}
Company: {{company}}
Exchange: {{exchange}}
Currency: {{currency}}
Country: {{country}}

IMPORTANT RULES:
1. TradingView uses specific symbol formats that may differ from Finnhub
2. For US stocks: Usually just the symbol (e.g., AAPL for Apple)
3. For international stocks: Often includes exchange prefix (e.g., NASDAQ:AAPL, NYSE:MSFT, LSE:BARC)
4. Some symbols may have suffixes for different share classes
5. ADRs and foreign stocks may have different symbol formats

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "tradingViewSymbol": "EXCHANGE:SYMBOL",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of why this mapping is correct"
}

EXAMPLES:
- Apple Inc. (AAPL) from Finnhub → {"tradingViewSymbol": "NASDAQ:AAPL", "confidence": "high", "reasoning": "Apple trades on NASDAQ as AAPL"}
- Microsoft Corp (MSFT) from Finnhub → {"tradingViewSymbol": "NASDAQ:MSFT", "confidence": "high", "reasoning": "Microsoft trades on NASDAQ as MSFT"}
- Barclays PLC (BARC.L) from Finnhub → {"tradingViewSymbol": "LSE:BARC", "confidence": "high", "reasoning": "Barclays trades on London Stock Exchange as BARC"}

Your response must be valid JSON only. Do not include any other text.`

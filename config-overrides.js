const { override } = require('customize-cra');

module.exports = override(
  // source-map-loader를 완전히 비활성화
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      // module.rules 배열을 찾습니다
      const rulesOneOf = config.module.rules.find(rule => Array.isArray(rule.oneOf));
      
      if (rulesOneOf && rulesOneOf.oneOf) {
        // source-map-loader 규칙을 찾아서 제거합니다
        rulesOneOf.oneOf = rulesOneOf.oneOf.filter(rule => 
          !(rule.use && rule.use.loader && rule.use.loader.includes('source-map-loader'))
        );
      }
    }
    
    return config;
  }
); 
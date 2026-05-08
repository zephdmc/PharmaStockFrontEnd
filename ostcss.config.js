// frontend/postcss.config.js
export default {
    plugins: {
      'tailwindcss': {},
      'autoprefixer': {},
      'postcss-preset-env': {
        features: { 'nesting-rules': false },
      },
    },
  }
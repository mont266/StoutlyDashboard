const codes = ['GBP', 'USD', 'VND', 'IDR', 'JPY'];
codes.forEach(code => {
    console.log(code, new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(12.3456));
});

codes = ['VND', 'IDR'];
codes.forEach(code => {
    console.log(code, new Intl.NumberFormat(undefined, { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(12.3456));
});

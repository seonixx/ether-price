var eventSetup = function () {
  $('.currency-select a').on('click', function () {
    $('.active-link').removeClass('active-link');

    $(this).addClass('active-link');

    etherPrice.setCurrency($(this).text());
    etherChart.setCurrency($(this).text());
  });
};

$(document).ready(eventSetup);


var etherPrice = (function () {
  var _currency;
  var _response = {};

  var currencies = {
    GBP: 'GBP',
    USD: 'USD'
  };

  var currencySymbol = {
    GBP: String.fromCharCode(163),
    USD: String.fromCharCode(36)
  };

  var _socket;

  var init = function (currency) {
    _currency = currency || currencies.GBP;

    _socket = io.connect('https://streamer.cryptocompare.com/');

    initWs();
  };

  var initWs = function () {
    var subscription = ['5~CCCAGG~ETH~' + _currency];

    _socket.emit('SubAdd', {subs:subscription});

    _socket.on('m', function(message){
      var messageType = message.substring(0, message.indexOf('~'));
      if (messageType === CCC.STATIC.TYPE.CURRENTAGG) {        
        Object.assign(_response, CCC.CURRENT.unpack(message));
        updatePrice(_response);
      }           
    });
  };

  var updateSub = function () {
    var subscriptions = ['5~CCCAGG~ETH~GBP', '5~CCCAGG~ETH~USD'];
    _socket.emit('SubRemove', {subs: subscriptions});

    var subscription = ['5~CCCAGG~ETH~' + _currency];
    _socket.emit('SubAdd', {subs: subscription});
  };

  var updatePrice = function (response) {
    var _quote = {
      price: response.PRICE,
      dayLow: response.LOW24HOUR,
      dayHigh: response.HIGH24HOUR,
      dayChange: Math.abs(response.OPEN24HOUR - response.PRICE),
      dayChangePerc: ((Math.abs(response.OPEN24HOUR - response.PRICE) / response.OPEN24HOUR) * 100),
      dayDirection: (response.OPEN24HOUR - response.PRICE) > 0 ? 'down' : 'up'
    };

    displayPrice(_quote);
  };

  var displayPrice = function (quote) {
    $('.price-up').removeClass('price-up');
    $('.price-down').removeClass('price-down');

    $('.current-price').text(currencySymbol[_currency] + quote.price.toFixed(2));
    $('.current-price-change').text((quote.dayDirection === 'up' ? '+' : '-') + quote.dayChangePerc.toFixed(2) + '%');
    $('.daily-low').text(currencySymbol[_currency] + quote.dayLow.toFixed(2));
    $('.daily-high').text(currencySymbol[_currency] + quote.dayHigh.toFixed(2));
    $('.daily-change').text(currencySymbol[_currency] + quote.dayChange.toFixed(2));

    $('.daily-change,.current-price-change').addClass(function () {
      return quote.dayDirection === 'up' ? 'price-up' : 'price-down';
    });
  };

  var setCurrency = function (curr) {
    _currency = currencies[curr];
    updateSub();
  };

  return {
    init: init,
    setCurrency: setCurrency
  };
})();

var etherChart = (function () {
  var _currency;

  var currencies = {
    GBP: 'GBP',
    USD: 'USD'
  };

  var init = function (currency) {
    _currency = currency || currencies.GBP;

    getHistorical()
    .done(function (response) {
      renderChart(parseData(response.Data));
    })
    .fail(function (err) {
      console.log(err);
    })
    .always(function () {
      console.log('Done!');
    });
  };

  var setCurrency = function (curr) {
    init(curr);
  };

  var getHistorical = function () {
    return $.getJSON('https://min-api.cryptocompare.com/data/histoday?fsym=ETH&tsym=' + _currency + '&e=CCCAGG&allData=true');
  };

  var parseData = function (data) {
    var newData = [];

    data.forEach(function (entry) {
      newData.push([entry.time * 1000, entry.close]);
    });

    return newData;
  };

  var renderChart = function (data) {
    Highcharts.createElement('link', {
      href: 'https://fonts.googleapis.com/css?family=Unica+One',
      rel: 'stylesheet',
      type: 'text/css'
    }, null, document.getElementsByTagName('head')[0]);

    Highcharts.theme = {
      colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
        '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
      chart: {
        backgroundColor: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
          stops: [
            [0, '#2a2a2b'],
            [1, '#3e3e40']
          ]
        },
        style: {
          fontFamily: '\'Unica One\', sans-serif'
        },
        plotBorderColor: '#606063'
      },
      title: {
        style: {
          color: '#E0E0E3',
          textTransform: 'uppercase',
          fontSize: '20px'
        }
      },
      subtitle: {
        style: {
          color: '#E0E0E3',
          textTransform: 'uppercase'
        }
      },
      xAxis: {
        gridLineColor: '#707073',
        labels: {
          style: {
            color: '#E0E0E3'
          }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        title: {
          style: {
            color: '#A0A0A3'

          }
        }
      },
      yAxis: {
        gridLineColor: '#707073',
        labels: {
          style: {
            color: '#E0E0E3'
          }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        tickWidth: 1,
        title: {
          style: {
            color: '#A0A0A3'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        style: {
          color: '#F0F0F0'
        }
      },
      plotOptions: {
        series: {
          dataLabels: {
            color: '#B0B0B3'
          },
          marker: {
            lineColor: '#333'
          }
        },
        boxplot: {
          fillColor: '#505053'
        },
        candlestick: {
          lineColor: 'white'
        },
        errorbar: {
          color: 'white'
        }
      },
      legend: {
        itemStyle: {
          color: '#E0E0E3'
        },
        itemHoverStyle: {
          color: '#FFF'
        },
        itemHiddenStyle: {
          color: '#606063'
        }
      },
      credits: {
        style: {
          color: '#666'
        }
      },
      labels: {
        style: {
          color: '#707073'
        }
      },

      drilldown: {
        activeAxisLabelStyle: {
          color: '#F0F0F3'
        },
        activeDataLabelStyle: {
          color: '#F0F0F3'
        }
      },

      navigation: {
        buttonOptions: {
          symbolStroke: '#DDDDDD',
          theme: {
            fill: '#505053'
          }
        }
      },

      // scroll charts
      rangeSelector: {
        buttonTheme: {
          fill: '#505053',
          stroke: '#000000',
          style: {
            color: '#CCC'
          },
          states: {
            hover: {
              fill: '#707073',
              stroke: '#000000',
              style: {
                color: 'white'
              }
            },
            select: {
              fill: '#000003',
              stroke: '#000000',
              style: {
                color: 'white'
              }
            }
          }
        },
        inputBoxBorderColor: '#505053',
        inputStyle: {
          backgroundColor: '#333',
          color: 'silver'
        },
        labelStyle: {
          color: 'silver'
        }
      },

      navigator: {
        handles: {
          backgroundColor: '#666',
          borderColor: '#AAA'
        },
        outlineColor: '#CCC',
        maskFill: 'rgba(255,255,255,0.1)',
        series: {
          color: '#7798BF',
          lineColor: '#A6C7ED'
        },
        xAxis: {
          gridLineColor: '#505053'
        }
      },

      scrollbar: {
        barBackgroundColor: '#808083',
        barBorderColor: '#808083',
        buttonArrowColor: '#CCC',
        buttonBackgroundColor: '#606063',
        buttonBorderColor: '#606063',
        rifleColor: '#FFF',
        trackBackgroundColor: '#404043',
        trackBorderColor: '#404043'
      },

      // special colors for some of the
      legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
      background2: '#505053',
      dataLabelsColor: '#B0B0B3',
      textColor: '#C0C0C0',
      contrastTextColor: '#F0F0F3',
      maskColor: 'rgba(255,255,255,0.3)'
    };

    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);
    // Create the chart
    Highcharts.stockChart('chart-container', {
      chart: {
        backgroundColor: '#17202a',
        style: {
          fontFamily: 'Lato',
          color: '#fff'
        }
      },
      scrollbar: {
        enabled: false
      },
      rangeSelector: {
        selected: 1
      },
      series: [{
        name: 'AAPL',
        data: data,
        tooltip: {
          valueDecimals: 2
        }
      }]
    });
  };

  return {
    init: init,
    setCurrency: setCurrency
  };

})();

etherPrice.init();
etherChart.init();
# Užklausų pavyzdžiai rankinei patikrai · v2.4.3

Šiuos adresus mūsų programa sudaro iš filtrų ir siunčia portalams (per
ScraperAPI). Atsidaryk juos naršyklėje ir palygink su tuo, ką tas pats
portalas rodo, kai tuos pačius filtrus sudedi ranka.

Sugeneruota komanda: `node backend/testai/filtrai.test.js --adresai`

**Kaip tikrinti:** kiekvienam adresui — ar portalo kairėje uždėti tie patys
filtrai, ir ar pirmo puslapio skelbimai tinka (kuras, dėžė, rida, metai).

**Ką reiškia mūsų kuro filtrai** (tas pats visuose portaluose):

| Pasirinkimas | Įeina |
|---|---|
| Dyzelinas | dyzelinas **+ dyzelino hibridai** (ir plug-in) |
| Benzinas | benzinas **+ benzino hibridai + dujos** |
| Hibridas | **visi** hibridai — benzino ir dyzelino, įskaitant plug-in |
| Elektrinis | tik elektra |

otomoto dyzelino hibridų atskirai neturi: ten „Dyzelinas" = tik dyzelinas, o
„Hibridas" = abu hibridų tipai.

---

## BMW nuo 2019, visi kurai
- autoplius: https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2&make_id%5B97%5D=0&make_id_list=97&make_date_from=2019&order_by=3&order_direction=DESC
- autogidas: https://autogidas.lt/skelbimai/automobiliai/?f_1[0]=BMW&f_41=2019&f_50=naujausi_asc
- autoscout24: https://www.autoscout24.com/lst/bmw?sort=standard&desc=0&atype=C&cy=D,A,B,E,F,I,L,NL&fregfrom=2019
- otomoto: https://www.otomoto.pl/osobowe/bmw?search[order]=filter_float_price:asc&search[filter_float_year:from]=2019

## BMW nuo 2019, HIBRIDAS
- autoplius: https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2&make_id%5B97%5D=0&make_id_list=97&make_date_from=2019&fuel_id%5B36%5D=36&fuel_id%5B17378%5D=17378&order_by=3&order_direction=DESC
- autogidas: https://autogidas.lt/skelbimai/automobiliai/?f_1[0]=BMW&f_41=2019&f_2[4]=Benzinas%2FElektra&f_2[5]=Benzinas%2FElektra%20(Plug-in)&f_2[6]=Benzinas%2FElektra%2FDujos&f_2[8]=Dyzelinas%2FElektra&f_2[9]=Dyzelinas%2FElektra%20(Plug-in)&f_50=naujausi_asc
- autoscout24: https://www.autoscout24.com/lst/bmw?sort=standard&desc=0&atype=C&cy=D,A,B,E,F,I,L,NL&fregfrom=2019&fuel=2,3
- otomoto: https://www.otomoto.pl/osobowe/bmw?search[order]=filter_float_price:asc&search[filter_float_year:from]=2019&search[filter_enum_fuel_type][0]=hybrid&search[filter_enum_fuel_type][1]=plugin-hybrid

## BMW nuo 2019, DYZELINAS
- autoplius: https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2&make_id%5B97%5D=0&make_id_list=97&make_date_from=2019&fuel_id%5B32%5D=32&fuel_id%5B17378%5D=17378&order_by=3&order_direction=DESC
- autogidas: https://autogidas.lt/skelbimai/automobiliai/?f_1[0]=BMW&f_41=2019&f_2[1]=Dyzelinas&f_2[8]=Dyzelinas%2FElektra&f_2[9]=Dyzelinas%2FElektra%20(Plug-in)&f_50=naujausi_asc
- autoscout24: https://www.autoscout24.com/lst/bmw?sort=standard&desc=0&atype=C&cy=D,A,B,E,F,I,L,NL&fregfrom=2019&fuel=D,3
- otomoto: https://www.otomoto.pl/osobowe/bmw?search[order]=filter_float_price:asc&search[filter_float_year:from]=2019&search[filter_enum_fuel_type][0]=diesel

## BMW nuo 2019, ELEKTRA
- autoplius: https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2&make_id%5B97%5D=0&make_id_list=97&make_date_from=2019&fuel_id%5B35%5D=35&order_by=3&order_direction=DESC
- autogidas: https://autogidas.lt/skelbimai/automobiliai/?f_1[0]=BMW&f_41=2019&f_2[7]=Elektra&f_50=naujausi_asc
- autoscout24: https://www.autoscout24.com/lst/bmw?sort=standard&desc=0&atype=C&cy=D,A,B,E,F,I,L,NL&fregfrom=2019&fuel=E
- otomoto: https://www.otomoto.pl/osobowe/bmw?search[order]=filter_float_price:asc&search[filter_float_year:from]=2019&search[filter_enum_fuel_type][0]=electric

## BMW X5 2020–2023, dyzelinas, automatinė, iki 150 000 km, 30–60 tūkst. €
- autoplius: https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2&make_id%5B97%5D=1308&make_id_list=97&make_date_from=2020&make_date_to=2023&sell_price_from=30000&sell_price_to=60000&kilometrage_to=150000&gearbox_id=38&fuel_id%5B32%5D=32&fuel_id%5B17378%5D=17378&order_by=3&order_direction=DESC
- autogidas: https://autogidas.lt/skelbimai/automobiliai/?f_1[0]=BMW&f_model_14[0]=X5&f_41=2020&f_42=2023&f_215=30000&f_216=60000&f_66=150000&f_10=Automatin%C4%97&f_2[1]=Dyzelinas&f_2[8]=Dyzelinas%2FElektra&f_2[9]=Dyzelinas%2FElektra%20(Plug-in)&f_50=naujausi_asc
- autoscout24: https://www.autoscout24.com/lst/bmw/x5?sort=standard&desc=0&atype=C&cy=D,A,B,E,F,I,L,NL&fregfrom=2020&fregto=2023&pricefrom=30000&priceto=60000&fuel=D,3&gear=A,S&kmto=150000
- otomoto: https://www.otomoto.pl/osobowe/bmw/x5?search[order]=filter_float_price:asc&search[filter_float_price:from]=127500&search[filter_float_price:to]=255000&search[filter_float_year:from]=2020&search[filter_float_year:to]=2023&search[filter_float_mileage:to]=150000&search[filter_enum_gearbox][0]=automatic&search[filter_enum_fuel_type][0]=diesel

---

## Ką rasi (pamatuota 2026-09-21, pirmas puslapis)

| Filtras | autoplius | autogidas | autoscout24 | otomoto |
|---|---|---|---|---|
| Hibridas | 413 (benz. + dyz. hibridai) | 270 | 26 123 | 594 |
| Dyzelinas | 669 (su hibridais) | 387 (su hibridais) | 44 596 (su hibridais) | 4 643 |
| Elektra | 86 | 40 | 7 994 | 236 |

Visur pirmame puslapyje buvo **tik tinkamas kuras**.

**otomoto rikiuoja „pigiausi viršuje"** — pirmame puslapyje matysi pigiausius
(dažnai daužtus ar dalims). Tai sąmoningai dar nepakeista.

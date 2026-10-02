insert into products (name, slug, description, category, price, image_url, is_active) values
('Chocolate Chip Thin','chocolate-chip-thin','Thin, crisp-edged and chewy in the middle, loaded with chocolate chips.','cookies',2500,'/products/chocolate-chip.svg',true),
('Biscoff Thin','biscoff-thin','A buttery thin cookie with caramelised Biscoff flavour.','cookies',2800,'/products/biscoff.svg',true),
('White Chocolate Thin','white-chocolate-thin','A delicate thin cookie packed with creamy white chocolate.','cookies',2800,'/products/white-chocolate.svg',true),
('Oreo Thin','oreo-thin','A chocolatey thin cookie loaded with Oreo pieces.','cookies',2800,'/products/oreo-cookie.svg',true),
('Taro Boba','taro-boba','Creamy taro milk tea with chewy boba pearls.','boba',3500,'/products/taro-boba.svg',true),
('Milk Tea Boba','milk-tea-boba','Classic creamy milk tea served with chewy boba pearls.','boba',3200,'/products/milk-tea.svg',true),
('Oreo Boba','oreo-boba','Sweet creamy milk tea blended with Oreo goodness and boba.','boba',3800,'/products/oreo-boba.svg',true),
('Lychee Boba','lychee-boba','Refreshing lychee tea with chewy boba pearls.','boba',3400,'/products/lychee-boba.svg',true)
on conflict (slug) do nothing;

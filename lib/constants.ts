export const INVOICE_JSON_SCHEMA = {
  type: "object",
  properties: {
    vendor: {
      type: "string",
      description: "Nama merchant, vendor, atau toko penerbit invoice/nota"
    },
    tanggal: {
      type: ["string", "null"],
      description: "Tanggal transaksi dalam format YYYY-MM-DD"
    },
    nominal_total: {
      type: ["number", "null"],
      description: "Total tagihan atau nominal akhir transaksi"
    },
    rincian_item: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nama: { type: "string", description: "Nama item, barang, atau jasa yang dibeli" },
          jumlah: { type: "number", description: "Jumlah/qty barang" },
          harga: { type: "number", description: "Harga satuan barang" }
        },
        required: ["nama", "jumlah", "harga"]
      },
      description: "Daftar item belanja yang tertera di nota"
    },
    kategori: {
      type: "string",
      description: "Kategori pengeluaran yang paling cocok dari pilihan berikut: 'Operasional', 'Pemasaran', 'Utilitas', 'Gaji', 'Logistik', 'Lainnya'"
    }
  },
  required: ["vendor", "tanggal", "nominal_total", "rincian_item", "kategori"]
}

// 测试数据脚本
// 在微信开发者工具的控制台中运行此脚本，快速添加测试数据

function addTestData() {
  const db = wx.cloud.database();
  
  const testData = [
    {
      name: "MacBook Pro",
      category: "电子设备",
      price: 15999,
      purchaseDate: "2023-09-01",
      status: "active",
      remark: "16GB 512GB",
      excludeTotal: false,
      excludeDaily: false
    },
    {
      name: "iPhone 15",
      category: "电子设备",
      price: 7999,
      purchaseDate: "2024-01-15",
      status: "active",
      remark: "256GB",
      excludeTotal: false,
      excludeDaily: false
    },
    {
      name: "iPad Air",
      category: "电子设备",
      price: 4799,
      purchaseDate: "2022-06-01",
      status: "retired",
      remark: "已换新",
      excludeTotal: true,
      excludeDaily: true
    },
    {
      name: "小米显示器",
      category: "电子设备",
      price: 1299,
      purchaseDate: "2023-11-10",
      status: "active",
      remark: "27寸 4K",
      excludeTotal: false,
      excludeDaily: false
    },
    {
      name: "旧笔记本电脑",
      category: "电子设备",
      price: 5000,
      purchaseDate: "2020-03-01",
      status: "sold",
      remark: "已出售",
      excludeTotal: true,
      excludeDaily: true
    }
  ];

  testData.forEach(item => {
    db.collection('assets').add({
      data: {
        ...item,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    }).then(res => {
      console.log('添加成功:', item.name);
    }).catch(err => {
      console.error('添加失败:', item.name, err);
    });
  });

  console.log('测试数据添加完成！');
}

// 调用方法：在控制台输入 addTestData()

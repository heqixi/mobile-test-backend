# Cowork CSV 业务数据

由本业务包维护；`domain-case` 不直接读此目录。

| 文件 | 说明 |
|------|------|
| `cowork_test_case_p0.csv` | 默认用例源（自根目录 `cowork_test_case.csv` 筛选 P0+P1，按状态承接排序） |
| `cowork_test_case_p0.csv.compiled.json` | 编译 sidecar |
| `cowork_test_case_p0.csv.reports/` | Midscene 运行报告（入库，随仓库共享） |
| `cowork_test_case_top10.csv` | 历史 top10 子集（可选） |

覆盖路径：`COWORK_CSV_PATH` / `COWORK_CSV_DATA_DIR`（见包 README）。

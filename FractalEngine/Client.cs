using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalEngine
{

	//public class Client : IClient
	//{
	//	private readonly string _userName;
	//	private readonly string _connectionId;
	//	private readonly Action<string, int> _callBack;

	//	public Client(string userName, string connectionId, Action<string, int> callBack)
	//	{
	//		_userName = userName ?? throw new ArgumentNullException(nameof(userName));
	//		_connectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
	//		_callBack = callBack;
	//	}

	//	public int ReceiveImageData(int data)
	//	{
	//		_callBack?.Invoke(_connectionId, data);
	//		return 0;
	//	}
	//}
}
